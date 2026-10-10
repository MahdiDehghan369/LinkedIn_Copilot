import { config } from '../../infrastructure/config/env.js';

export class LinkedInController {
  /** @param {import('./linkedin.service.js').LinkedInService} linkedinService */
  constructor(linkedinService) {
    this.linkedinService = linkedinService;
  }

  /**
   * GET /api/linkedin/connect — redirects the browser to LinkedIn's
   * authorization screen.
   */
  async connect(req, res) {
    const authorizationUrl = await this.linkedinService.getAuthorizationUrl(req.userId);
    res.redirect(authorizationUrl);
  }

  /**
   * GET /api/linkedin/callback — LinkedIn redirects the browser back
   * here. This is a browser navigation, not a JSON API call, so failures
   * redirect back into the app with a query flag rather than throwing to
   * the JSON error handler.
   */
  async callback(req, res) {
    const { code, state, error } = req.query;

    if (error) {
      res.redirect(`${config.frontendUrl}/profile?linkedin=denied`);
      return;
    }

    try {
      await this.linkedinService.handleCallback({ code, state });
      res.redirect(`${config.frontendUrl}/profile?linkedin=connected`);
    } catch {
      res.redirect(`${config.frontendUrl}/profile?linkedin=error`);
    }
  }

  /** GET /api/linkedin/status */
  async status(req, res) {
    const status = await this.linkedinService.getStatus(req.userId);
    res.sendResponse(200, status);
  }

  /** DELETE /api/linkedin/disconnect */
  async disconnect(req, res) {
    const result = await this.linkedinService.disconnect(req.userId);
    res.sendResponse(200, result);
  }
}
