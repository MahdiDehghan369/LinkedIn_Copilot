export class UsersController {
  /** @param {import('./users.service.js').UsersService} usersService */
  constructor(usersService) {
    this.usersService = usersService;
  }

  /**
   * GET /api/users/me
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getMe(req, res) {
    const profile = await this.usersService.getProfile(req.userId);
    res.sendResponse(200, { user: profile });
  }

  /**
   * PATCH /api/users/me
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async updateMe(req, res) {
    const profile = await this.usersService.updateProfile(req.userId, req.body);
    res.sendResponse(200, { user: profile });
  }
}
