import { RateLimitError } from '../../shared/errors/index.js';

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS_PER_WINDOW = 20;

/**
 * Registered as a Silay `type: 'middleware'` item with `dependencies:
 * ['redisService']` — the module manager resolves `redisService` and
 * calls this factory once, then the returned function is the actual
 * per-request middleware (same pattern as `validate`'s schema-arg
 * resolution, just via DI instead of route-config args).
 *
 * Keyed by IP rather than email/username: the goal is slowing down a
 * script hammering the endpoint, not penalizing a specific account (an
 * attacker can always vary the email; they can't as easily vary source
 * IPs at this simple a layer).
 *
 * @param {import('../../infrastructure/redis/redis.service.js').RedisService} redisService
 */
export function buildAuthRateLimiter(redisService) {
  return async function authRateLimiter(req, res, next) {
    try {
      const key = `ratelimit:auth:${req.ip}`;
      const count = await redisService.increment(key, WINDOW_SECONDS);
      if (count > MAX_ATTEMPTS_PER_WINDOW) {
        next(new RateLimitError('Too many login attempts. Please wait a few minutes and try again.'));
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
