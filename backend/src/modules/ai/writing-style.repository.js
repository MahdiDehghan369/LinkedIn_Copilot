export class WritingStyleRepository {
  /** @param {import('mongoose').Model} writingStyleModel */
  constructor(writingStyleModel) {
    this.model = writingStyleModel;
  }

  /**
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async findByUserId(userId) {
    return this.model.findOne({ userId }).exec();
  }

  /**
   * @param {string} userId
   * @param {object} profile
   * @returns {Promise<import('mongoose').Document>}
   */
  async upsertProfile(userId, profile) {
    const existing = await this.model.findOne({ userId }).exec();
    if (existing) {
      existing.profile = profile;
      existing.analyzedAt = new Date();
      return existing.save();
    }
    return this.model.create({ userId, profile, analyzedAt: new Date() });
  }
}
