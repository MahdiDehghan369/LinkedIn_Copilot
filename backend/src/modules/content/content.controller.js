export class ContentController {
  /** @param {import('./content.service.js').ContentService} contentService */
  constructor(contentService) {
    this.content = contentService;
  }

  /** GET /api/content/ideas */
  async listIdeas(req, res) {
    const ideas = await this.content.listIdeas(req.userId, req.query);
    res.sendResponse(200, { ideas });
  }

  /** POST /api/content/ideas */
  async saveIdea(req, res) {
    const idea = await this.content.saveIdea(req.userId, req.body);
    res.sendResponse(201, { idea });
  }

  /** PATCH /api/content/ideas/:id */
  async updateIdeaStatus(req, res) {
    const idea = await this.content.updateIdeaStatus(req.userId, req.params.id, req.body.status);
    res.sendResponse(200, { idea });
  }

  /** GET /api/content/calendar?week=YYYY-MM-DD */
  async getCalendar(req, res) {
    const calendar = await this.content.getCalendar(req.userId, req.query.week);
    res.sendResponse(200, { calendar: calendar ?? null });
  }

  /** PUT /api/content/calendar */
  async upsertCalendar(req, res) {
    const { weekStart, ...data } = req.body;
    const calendar = await this.content.upsertCalendar(req.userId, weekStart, data);
    res.sendResponse(200, { calendar });
  }

  /** GET /api/content/gaps */
  async getGaps(req, res) {
    const gaps = await this.content.getGapAnalysis(req.userId);
    res.sendResponse(200, { gaps });
  }
}
