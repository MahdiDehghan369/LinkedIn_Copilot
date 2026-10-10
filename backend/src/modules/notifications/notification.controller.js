export class NotificationController {
  /** @param {import('./notification.service.js').NotificationService} notificationService */
  constructor(notificationService) {
    this.notifications = notificationService;
  }

  /** GET /api/notifications?unread=true */
  async list(req, res) {
    const notifications = await this.notifications.list(req.userId, req.query);
    res.sendResponse(200, { notifications });
  }

  /** PATCH /api/notifications/:id/read */
  async markRead(req, res) {
    const notification = await this.notifications.markRead(req.userId, req.params.id);
    res.sendResponse(200, { notification });
  }
}
