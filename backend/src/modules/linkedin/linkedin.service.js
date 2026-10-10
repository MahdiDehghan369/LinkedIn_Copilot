import crypto from 'node:crypto';
import { encrypt, decrypt } from '../../shared/utils/crypto.js';
import { logger } from '../../infrastructure/logger/index.js';
import { LinkedInAuthError, LinkedInRateLimitError, LinkedInNotConnectedError } from './linkedin.errors.js';
import { NOTIFICATION_TYPES } from '../notifications/notification.service.js';

const linkedinLogger = logger.child({ module: 'linkedin' });

const OAUTH_STATE_PREFIX = 'oauth:state:';
const OAUTH_STATE_TTL_SECONDS = 600; // 10 minutes to complete the LinkedIn redirect round-trip

const RATE_LIMIT_PREFIX = 'linkedin:ratelimit:';
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const RATE_LIMIT_MAX_PER_WINDOW = 100; // conservative default; tune once real product-tier limits are known

/**
 * Orchestrates the OAuth handshake, publishing, and reading engagement
 * data back. Never talks to LinkedIn's HTTP API directly — that's
 * `LinkedInClient`'s job, injected here so it can be swapped for a fake
 * in tests without any network access (architecture doc: "LinkedIn API
 * calls must be mockable").
 */
export class LinkedInService {
  /**
   * @param {import('./linkedin.repository.js').LinkedInAccountRepository} linkedInAccountRepository
   * @param {import('./linkedin.client.js').LinkedInClient} linkedinClient
   * @param {import('../../infrastructure/redis/redis.service.js').RedisService} redisService
   * @param {import('../notifications/notification.service.js').NotificationService} notificationService
   */
  constructor(
    linkedInAccountRepository,
    linkedinClient,
    redisService,
    notificationService,
  ) {
    this.repository = linkedInAccountRepository;
    this.client = linkedinClient;
    this.redis = redisService;
    this.notifications = notificationService;
  }

  /**
   * @param {string} userId
   * @returns {Promise<string>} the LinkedIn authorization URL to redirect the browser to
   */
  async getAuthorizationUrl(userId) {
    const state = crypto.randomUUID();
    await this.redis.set(`${OAUTH_STATE_PREFIX}${state}`, userId, {
      ttlSeconds: OAUTH_STATE_TTL_SECONDS,
    });
    return this.client.buildAuthorizationUrl(state);
  }

  /**
   * @param {{ code: string, state: string }} input
   * @returns {Promise<{ connected: true }>}
   */
  async handleCallback({ code, state }) {
    const stateKey = `${OAUTH_STATE_PREFIX}${state}`;
    const userId = await this.redis.get(stateKey);
    if (!userId) {
      throw new LinkedInAuthError(
        "This LinkedIn connection link has expired. Please try connecting again.",
      );
    }
    await this.redis.del(stateKey); // single use — a replayed callback must fail

    const token = await this.client.exchangeCodeForToken(code);
    const profile = await this.client.fetchProfile(token.accessToken);

    await this.repository.upsert(userId, {
      linkedinUserId: profile.linkedinUserId,
      accessTokenEnc: encrypt(token.accessToken),
      refreshTokenEnc: token.refreshToken
        ? encrypt(token.refreshToken)
        : undefined,
      tokenExpiresAt: new Date(Date.now() + token.expiresInSeconds * 1000),
      scopes: token.scope ? token.scope.split(" ") : [],
      status: "connected",
      connectedAt: new Date(),
    });

    linkedinLogger.info("LinkedIn account connected", {
      userId,
      externalProvider: "linkedin",
    });
    return { connected: true };
  }

  /**
   * @param {string} userId
   * @returns {Promise<{ connected: boolean, connectedAt?: Date, status?: string }>}
   */
  async getStatus(userId) {
    const account = await this.repository.findByUserId(userId);
    if (!account) return { connected: false };
    return {
      connected: account.status === "connected",
      connectedAt: account.connectedAt,
      status: account.status,
    };
  }

  /**
   * @param {string} userId
   * @returns {Promise<{ connected: false }>}
   */
  async disconnect(userId) {
    await this.repository.deleteByUserId(userId);
    linkedinLogger.info("LinkedIn account disconnected", {
      userId,
      externalProvider: "linkedin",
    });
    return { connected: false };
  }

  /**
   * @param {string} userId
   * @param {string} text
   * @param {{ buffer: Buffer, mimeType: string }} [image]
   * @returns {Promise<{ linkedinPostId: string|null }>}
   */
  async publish(userId, text, image) {
    await this.#enforceRateLimit(userId);
    const account = await this.#requireConnectedAccount(userId);
    const authorUrn = `urn:li:person:${account.linkedinUserId}`;

    const result = await this.#executeWithRefresh(
      account,
      async (accessToken) => {
        let imageAsset;
        if (image) {
          const { uploadUrl, asset } = await this.client.registerImageUpload(
            accessToken,
            authorUrn,
          );
          await this.client.uploadImageBinary(
            uploadUrl,
            accessToken,
            image.buffer,
          );
          imageAsset = asset;
        }
        return this.client.publishPost({
          accessToken,
          authorUrn,
          text,
          imageAsset,
        });
      },
    );
    linkedinLogger.info("Post published to LinkedIn", {
      userId,
      externalProvider: "linkedin",
      linkedinPostId: result.linkedinPostId,
      withImage: Boolean(image),
    });
    return result;
  }

  /**
   * Reads engagement counts for a post already published to LinkedIn.
   * Raw counts only — computing an engagement *rate* from them is a
   * business-metric decision that belongs to the `analytics` module, not
   * here (architecture doc §C: `linkedin` stays a thin, opinion-free
   * client of the platform).
   *
   * Note: LinkedIn's basic member-post API surface (the `w_member_social`
   * scope this app requests) exposes reaction/comment counts but not
   * impressions — true impression data requires Marketing Developer
   * Platform partner access. `impressions` is therefore `null` unless
   * LinkedIn's response includes it.
   *
   * @param {string} userId
   * @param {string} linkedinPostId
   * @returns {Promise<{ impressions: number|null, reactions: number, comments: number, reposts: number }>}
   */
  async getPostEngagement(userId, linkedinPostId) {
    const account = await this.#requireConnectedAccount(userId);
    return this.#executeWithRefresh(account, (accessToken) =>
      this.client.fetchPostEngagement(accessToken, linkedinPostId),
    );
  }

  /**
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document>}
   */
  async #requireConnectedAccount(userId) {
    const account = await this.repository.findByUserId(userId, {
      withTokens: true,
    });
    if (!account || account.status !== "connected") {
      throw new LinkedInNotConnectedError();
    }
    return account;
  }

  /**
   * Runs `action` with the account's current access token; on a 401,
   * transparently refreshes once and retries (architecture doc §H) —
   * never surfaced to the caller as a separate step. Shared by every
   * method that calls LinkedIn with a stored token.
   * @param {import('mongoose').Document} account
   * @param {(accessToken: string) => Promise<unknown>} action
   */
  async #executeWithRefresh(account, action) {
    try {
      return await action(decrypt(account.accessTokenEnc));
    } catch (error) {
      if (error instanceof LinkedInAuthError && account.refreshTokenEnc) {
        return this.#retryAfterRefresh(account, action);
      }
      if (error instanceof LinkedInAuthError) {
        await this.#markExpired(account.userId);
      }
      linkedinLogger.warn("LinkedIn API call failed", {
        userId: account.userId,
        externalProvider: "linkedin",
        error,
      });
      throw error;
    }
  }

  /**
   * @param {import('mongoose').Document} account
   * @param {(accessToken: string) => Promise<unknown>} action
   */
  async #retryAfterRefresh(account, action) {
    try {
      const refreshed = await this.client.refreshAccessToken(
        decrypt(account.refreshTokenEnc),
      );
      account.accessTokenEnc = encrypt(refreshed.accessToken);
      if (refreshed.refreshToken)
        account.refreshTokenEnc = encrypt(refreshed.refreshToken);
      account.tokenExpiresAt = new Date(
        Date.now() + refreshed.expiresInSeconds * 1000,
      );
      await account.save();

      return await action(refreshed.accessToken);
    } catch (refreshError) {
      await this.#markExpired(account.userId);
      linkedinLogger.warn("LinkedIn token refresh failed", {
        userId: account.userId,
        externalProvider: "linkedin",
        error: refreshError,
      });
      throw refreshError;
    }
  }

  /**
   * Marks the account expired and lets the user know via the
   * notifications module (architecture doc §34's own example: "LinkedIn
   * connection expired").
   * @param {string} userId
   */
  async #markExpired(userId) {
    await this.repository.markStatus(userId, "expired");
    await this.notifications.create(userId, {
      type: NOTIFICATION_TYPES.LINKEDIN_EXPIRED,
      message:
        "Your LinkedIn connection has expired. Reconnect it to keep publishing.",
    });
  }

  /** @param {string} userId */
  async #enforceRateLimit(userId) {
    const count = await this.redis.increment(
      `${RATE_LIMIT_PREFIX}${userId}`,
      RATE_LIMIT_WINDOW_SECONDS,
    );
    if (count > RATE_LIMIT_MAX_PER_WINDOW) {
      throw new LinkedInRateLimitError(
        "You have hit Copilot\u2019s LinkedIn publishing limit for this hour.",
      );
    }
  }
}
