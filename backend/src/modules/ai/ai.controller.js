export class AiController {
  /** @param {import('./ai.service.js').AiService} aiService */
  constructor(aiService) {
    this.aiService = aiService;
  }

  /** POST /api/ai/ideas */
  async ideas(req, res) {
    const result = await this.aiService.generateIdeas(req.userId, req.body);
    res.sendResponse(200, result);
  }

  /** POST /api/ai/posts/generate */
  async generatePost(req, res) {
    const result = await this.aiService.generatePost(req.userId, req.body);
    res.sendResponse(200, result);
  }

  /** POST /api/ai/posts/improve */
  async improvePost(req, res) {
    const result = await this.aiService.improvePost(req.userId, req.body);
    res.sendResponse(200, result);
  }

  /** POST /api/ai/analyze — writing-style analysis over user-supplied sample posts */
  async analyze(req, res) {
    const result = await this.aiService.analyzeWritingStyle(req.userId, req.body);
    res.sendResponse(200, result);
  }
}
