export class ScheduledPostRepository {
  /** @param {import('mongoose').Model} scheduledPostModel */
  constructor(scheduledPostModel) {
    this.model = scheduledPostModel;
  }

  /**
   * @param {{ postId: string, userId: string, runAt: Date }} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(data) {
    return this.model.create({ ...data, status: 'pending' });
  }

  /**
   * @param {Date} now
   * @param {number} [limit]
   * @returns {Promise<import('mongoose').Document[]>}
   */
  async findDue(now, limit = 50) {
    return this.model
      .find({ status: 'pending', runAt: { $lte: now } })
      .limit(limit)
      .exec();
  }

  /** @param {string} id */
  async markDispatched(id) {
    await this.model.updateOne({ _id: id }, { $set: { status: 'dispatched' }, $inc: { attempts: 1 } }).exec();
  }

  /**
   * @param {string} id
   * @param {string} errorMessage
   */
  async markFailed(id, errorMessage) {
    await this.model
      .updateOne({ _id: id }, { $set: { status: 'failed', lastError: errorMessage }, $inc: { attempts: 1 } })
      .exec();
  }
}
