export class ContentCalendarRepository {
  /** @param {import('mongoose').Model} contentCalendarModel */
  constructor(contentCalendarModel) {
    this.model = contentCalendarModel;
  }

  /**
   * @param {string} userId
   * @param {string} weekStart
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async findByUserAndWeek(userId, weekStart) {
    return this.model.findOne({ userId, weekStart }).exec();
  }

  /**
   * @param {string} userId
   * @param {string} weekStart
   * @param {{ slots?: object[], preferences?: object }} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async upsert(userId, weekStart, data) {
    const existing = await this.model.findOne({ userId, weekStart }).exec();
    if (existing) {
      if (data.slots) existing.slots = data.slots;
      if (data.preferences) existing.preferences = data.preferences;
      return existing.save();
    }
    return this.model.create({ userId, weekStart, ...data });
  }
}
