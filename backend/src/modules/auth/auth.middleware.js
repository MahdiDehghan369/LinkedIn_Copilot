import { AuthenticationError } from '../../shared/errors/index.js';

/**
 * Route guard for any endpoint that requires an authenticated user.
 * Reads the server-side session (resolved from the HttpOnly cookie by
 * `sessionMiddleware`) and, if present, exposes the user id as
 * `req.userId` for downstream controllers/services — the one place in
 * the app that translates "has a valid session" into "is this request's
 * identity" (architecture doc §36: authorization checks happen here,
 * not re-implemented per controller).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireAuth(req, res, next) {
  const userId = req.session?.userId;
  if (!userId) {
    next(new AuthenticationError());
    return;
  }
  req.userId = userId;
  next();
}
