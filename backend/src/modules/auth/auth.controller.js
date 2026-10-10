import { regenerateSession, saveSession, destroySession } from './session.utils.js';
import { config } from '../../infrastructure/config/env.js';

export class AuthController {
  /** @param {import('./auth.service.js').AuthService} authService */
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * POST /api/auth/register
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async register(req, res) {
    const user = await this.authService.register(req.body);
    await regenerateSession(req);
    req.session.userId = user.id;
    await saveSession(req);
    res.sendResponse(201, { user });
  }

  /**
   * POST /api/auth/login
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async login(req, res) {
    const user = await this.authService.login(req.body);
    await regenerateSession(req);
    req.session.userId = user.id;
    await saveSession(req);
    res.sendResponse(200, { user });
  }

  /**
   * POST /api/auth/logout
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async logout(req, res) {
    await destroySession(req);
    res.clearCookie(config.session.cookieName);
    res.sendResponse(200, { message: 'Logged out successfully.' });
  }
}
