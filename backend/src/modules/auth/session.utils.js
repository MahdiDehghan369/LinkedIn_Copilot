/**
 * @file express-session's regenerate/save/destroy are callback-based;
 * these thin promise wrappers let the auth controller `await` them
 * instead of nesting callbacks.
 */

/**
 * Regenerates the session ID (session-fixation protection) — always
 * called on login/register before writing `userId` into the new session,
 * so a pre-authentication session ID is never reused as a post-auth one.
 * @param {import('express').Request} req
 * @returns {Promise<void>}
 */
export function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

/**
 * @param {import('express').Request} req
 * @returns {Promise<void>}
 */
export function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

/**
 * @param {import('express').Request} req
 * @returns {Promise<void>}
 */
export function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}
