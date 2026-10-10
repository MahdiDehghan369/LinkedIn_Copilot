/**
 * Uses find + mutate + `save()` rather than `findOneAndUpdate` for the
 * same reason as `users.repository.js`: `accessTokenEnc`/`refreshTokenEnc`
 * are `select: false`, so an update-with-projection command hits the same
 * `findAndModify` incompatibility with this environment's local MongoDB
 * stand-in — and find+save is the more idiomatic Mongoose pattern anyway.
 */
export class LinkedInAccountRepository {
  /** @param {import('mongoose').Model} linkedInAccountModel */
  constructor(linkedInAccountModel) {
    this.model = linkedInAccountModel;
  }

  /**
   * @param {string} userId
   * @param {{ withTokens?: boolean }} [options]
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async findByUserId(userId, { withTokens = false } = {}) {
    const query = this.model.findOne({ userId });
    if (withTokens) query.select('+accessTokenEnc +refreshTokenEnc');
    return query.exec();
  }

  /**
   * Creates the account on first connect, or updates it (including
   * rotating tokens) on reconnect.
   * @param {string} userId
   * @param {Record<string, unknown>} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async upsert(userId, data) {
    const existing = await this.model.findOne({ userId }).select('+accessTokenEnc +refreshTokenEnc').exec();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return this.model.create({ userId, ...data });
  }

  /**
   * @param {string} userId
   * @param {'connected'|'expired'|'revoked'} status
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async markStatus(userId, status) {
    const account = await this.model.findOne({ userId }).exec();
    if (!account) return null;
    account.status = status;
    return account.save();
  }

  /**
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async deleteByUserId(userId) {
    await this.model.deleteOne({ userId }).exec();
  }
}
