export class AnalyticsController {
  /** @param {import('./analytics.service.js').AnalyticsService} analyticsService */
  constructor(analyticsService) {
    this.analytics = analyticsService;
  }

  /** GET /api/analytics/overview */
  async overview(req, res) {
    const result = await this.analytics.getOverview(req.userId);
    res.sendResponse(200, result);
  }

  /** GET /api/analytics/posts/:id */
  async getPostAnalytics(req, res) {
    const analytics = await this.analytics.getPostAnalytics(req.userId, req.params.id);
    res.sendResponse(200, { analytics });
  }

  /** POST /api/analytics/posts/:id/refresh */
  async refreshPostAnalytics(req, res) {
    const analytics = await this.analytics.refreshPostAnalytics(req.userId, req.params.id);
    res.sendResponse(200, { analytics });
  }

  /** POST /api/analytics/posts/:id/insights */
  async getPerformanceInsight(req, res) {
    const result = await this.analytics.getPerformanceInsight(req.userId, req.params.id);
    res.sendResponse(200, result);
  }
}
