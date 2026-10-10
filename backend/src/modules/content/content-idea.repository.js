export class ContentIdeaRepository {
  /** @param {import('mongoose').Model} contentIdeaModel */
  constructor(contentIdeaModel) {
    this.model = contentIdeaModel;
  }

  /**
   * @param {string} userId
   * @param {Record<string, unknown>} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(userId, data) {
    return this.model.create({ userId, ...data });
  }

  /**
   * @param {string} userId
   * @param {{ status?: string }} [options]
   * @returns {Promise<import('mongoose').Document[]>}
   */
  async listForUser(userId, { status } = {}) {
    return this.model
      .find({ userId, ...(status ? { status } : {}) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async findByIdForUser(id, userId) {
    return this.model.findOne({ _id: id, userId }).exec();
  }
}
