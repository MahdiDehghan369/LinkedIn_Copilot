import { NotFoundError } from '../../shared/errors/index.js';

/** Notification `type` values other modules create — kept here so every caller uses the same vocabulary. */
export const NOTIFICATION_TYPES = Object.freeze({
  POST_PUBLISHED: 'post.published',
  POST_PUBLISH_FAILED: 'post.publish_failed',
  LINKEDIN_EXPIRED: 'linkedin.expired',
});

export class NotificationService {
  /** @param {import('./notification.repository.js').NotificationRepository} notificationRepository */
  constructor(notificationRepository) {
    this.repository = notificationRepository;
  }

  /**
   * @param {string} userId
   * @param {{ type: string, message: string, relatedEntity?: { type: string, id: string } }} data
   */
  async create(userId, data) {
    return this.repository.create(userId, data);
  }

  /**
   * @param {string} userId
   * @param {{ unread?: boolean }} query
   */
  async list(userId, query) {
    return this.repository.listForUser(userId, query);
  }

  /**
   * @param {string} userId
   * @param {string} notificationId
   */
  async markRead(userId, notificationId) {
    const notification = await this.repository.markRead(notificationId, userId);
    if (!notification) throw new NotFoundError('Notification not found.');
    return notification;
  }
}
