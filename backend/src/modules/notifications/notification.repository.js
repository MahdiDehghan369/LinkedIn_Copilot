export class NotificationRepository {
  /** @param {import('mongoose').Model} notificationModel */
  constructor(notificationModel) {
    this.model = notificationModel;
  }

  /**
   * @param {string} userId
   * @param {{ type: string, message: string, relatedEntity?: { type: string, id: string } }} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(userId, data) {
    return this.model.create({ userId, ...data });
  }

  /**
   * @param {string} userId
   * @param {{ unread?: boolean }} [options]
   * @returns {Promise<import('mongoose').Document[]>}
   */
  async listForUser(userId, { unread } = {}) {
    const filter = { userId, ...(unread ? { read: false } : {}) };
    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async markRead(id, userId) {
    const notification = await this.model.findOne({ _id: id, userId }).exec();
    if (!notification) return null;
    notification.read = true;
    return notification.save();
  }
}
