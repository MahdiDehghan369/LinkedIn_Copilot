const MAX_HISTORY_ENTRIES = 10;

export class PostAnalyticsRepository {
  /** @param {import('mongoose').Model} postAnalyticsModel */
  constructor(postAnalyticsModel) {
    this.model = postAnalyticsModel;
  }

  /**
   * @param {string} postId
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async findByPostId(postId) {
    return this.model.findOne({ postId }).exec();
  }

  /**
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document[]>}
   */
  async findAllForUser(userId) {
    return this.model.find({ userId }).exec();
  }

  /**
   * Records a fresh snapshot as the current values and appends it to the
   * (capped) history — the current fields are a denormalized "latest"
   * view so reads don't need to look inside the array.
   * @param {string} postId
   * @param {string} userId
   * @param {{ impressions: number|null, reactions: number, comments: number, reposts: number, engagementRate: number|null }} metrics
   * @returns {Promise<import('mongoose').Document>}
   */
  async recordSnapshot(postId, userId, metrics) {
    const fetchedAt = new Date();
    const snapshot = { fetchedAt, ...metrics };

    let doc = await this.model.findOne({ postId }).exec();
    if (!doc) {
      doc = new this.model({ postId, userId, ...metrics, fetchedAt, history: [snapshot] });
    } else {
      Object.assign(doc, metrics);
      doc.fetchedAt = fetchedAt;
      doc.history.push(snapshot);
      if (doc.history.length > MAX_HISTORY_ENTRIES) {
        doc.history = doc.history.slice(-MAX_HISTORY_ENTRIES);
      }
    }
    return doc.save();
  }
}
