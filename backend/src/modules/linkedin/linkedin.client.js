import { config } from '../../infrastructure/config/env.js';
import {
  LinkedInAuthError,
  LinkedInRateLimitError,
  LinkedInValidationError,
  LinkedInApiError,
} from './linkedin.errors.js';

const AUTHORIZATION_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const UGC_POSTS_URL = 'https://api.linkedin.com/v2/ugcPosts';
const SOCIAL_ACTIONS_URL = 'https://api.linkedin.com/v2/socialActions';
const ASSETS_URL = "https://api.linkedin.com/v2/assets";
const OAUTH_SCOPES = ['openid', 'profile', 'w_member_social'];

/**
 * Thin wrapper around LinkedIn's REST/OAuth endpoints using the platform
 * `fetch`. Every method throws one of the typed errors from
 * `linkedin.errors.js` instead of leaking a raw `Response`/HTTP error —
 * callers (the service layer, and eventually the scheduler) only ever
 * see that small typed set (architecture doc §H).
 */
export class LinkedInClient {
  constructor() {
    this.clientId = config.linkedin.clientId;
    this.clientSecret = config.linkedin.clientSecret;
    this.redirectUri = config.linkedin.redirectUri;
  }

  /**
   * @param {string} state opaque CSRF token, single-use, tracked in Redis by the service layer
   * @returns {string}
   */
  buildAuthorizationUrl(state) {
    const url = new URL(AUTHORIZATION_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', OAUTH_SCOPES.join(' '));
    return url.toString();
  }

  /**
   * @param {string} code
   * @returns {Promise<{ accessToken: string, refreshToken?: string, expiresInSeconds: number, scope?: string }>}
   */
  exchangeCodeForToken(code) {
    return this.#requestToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
  }

  /**
   * @param {string} refreshToken
   * @returns {Promise<{ accessToken: string, refreshToken?: string, expiresInSeconds: number, scope?: string }>}
   */
  refreshAccessToken(refreshToken) {
    return this.#requestToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
  }

  /**
   * @param {string} accessToken
   * @returns {Promise<{ linkedinUserId: string }>}
   */
  async fetchProfile(accessToken) {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = await this.#safeJson(response);
    if (!response.ok) throw this.#mapError(response.status, payload);
    return { linkedinUserId: payload.sub };
  }

  /**
   * @param {{ accessToken: string, authorUrn: string, text: string }} input
   * @returns {Promise<{ linkedinPostId: string|null }>}
   */
  /**
   * @param {{ accessToken: string, authorUrn: string, text: string, imageAsset?: string }} input
   * @returns {Promise<{ linkedinPostId: string|null }>}
   */
  async publishPost({ accessToken, authorUrn, text, imageAsset }) {
    const specificContent = {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: imageAsset ? 'IMAGE' : 'NONE',
        ...(imageAsset ? { media: [{ status: 'READY', media: imageAsset }] } : {}),
      },
    };

    const response = await fetch(UGC_POSTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent,
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (!response.ok) {
      throw this.#mapError(response.status, await this.#safeJson(response));
    }

    return { linkedinPostId: response.headers.get('x-restli-id') };
  }

  /**
   * Step 1 of LinkedIn's image upload flow: register an upload slot and
   * get back both the URL to PUT the binary to and the asset URN to
   * reference in the post itself.
   * @param {string} accessToken
   * @param {string} authorUrn
   * @returns {Promise<{ uploadUrl: string, asset: string }>}
   */
  async registerImageUpload(accessToken, authorUrn) {
    const response = await fetch(`${ASSETS_URL}?action=registerUpload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
        },
      }),
    });

    const payload = await this.#safeJson(response);
    if (!response.ok) throw this.#mapError(response.status, payload);

    return {
      uploadUrl:
        payload.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl,
      asset: payload.value?.asset,
    };
  }

  /**
   * Step 2: PUT the actual image bytes to the URL from `registerImageUpload`.
   * @param {string} uploadUrl
   * @param {string} accessToken
   * @param {Buffer} imageBuffer
   * @returns {Promise<void>}
   */
  async uploadImageBinary(uploadUrl, accessToken, imageBuffer) {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: imageBuffer,
    });
    if (!response.ok) {
      throw this.#mapError(response.status, await this.#safeJson(response));
    }
  }

  /**
   * Reads reaction/comment counts for a post via LinkedIn's Social
   * Actions API. `w_member_social` (this app's scope) does not expose
   * impressions — that requires Marketing Developer Platform partner
   * access — so `impressions` is always `null` here; it's left in the
   * return shape so a future elevated-access integration is a pure
   * addition, not a breaking change to callers.
   * @param {string} accessToken
   * @param {string} linkedinPostId
   * @returns {Promise<{ impressions: number|null, reactions: number, comments: number, reposts: number }>}
   */
  async fetchPostEngagement(accessToken, linkedinPostId) {
    const response = await fetch(`${SOCIAL_ACTIONS_URL}/${encodeURIComponent(linkedinPostId)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
    const payload = await this.#safeJson(response);
    if (!response.ok) throw this.#mapError(response.status, payload);

    return {
      impressions: null,
      reactions: payload.likesSummary?.totalLikes ?? 0,
      comments: payload.commentsSummary?.totalFirstLevelComments ?? 0,
      reposts: payload.sharesSummary?.totalShares ?? 0,
    };
  }

  /** @param {Record<string, unknown>} params */
  async #requestToken(params) {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });
    const payload = await this.#safeJson(response);
    if (!response.ok) throw this.#mapError(response.status, payload);

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresInSeconds: payload.expires_in,
      scope: payload.scope,
    };
  }

  /** @param {Response} response */
  async #safeJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  /**
   * @param {number} status
   * @param {{ message?: string }} payload
   */
  #mapError(status, payload) {
    const message = payload?.message;
    if (status === 401) return new LinkedInAuthError(message);
    if (status === 429) return new LinkedInRateLimitError(message);
    if (status >= 400 && status < 500) return new LinkedInValidationError(message);
    return new LinkedInApiError(message);
  }
}
