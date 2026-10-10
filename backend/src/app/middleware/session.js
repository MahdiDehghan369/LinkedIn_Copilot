import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { redisClient } from '../../infrastructure/redis/client.js';
import { config } from '../../infrastructure/config/env.js';

/**
 * Builds the Redis-backed session middleware (architecture doc §L, Phase 1
 * decision: session cookie, not JWT). Sessions live entirely server-side in
 * Redis; the browser only ever holds an opaque, signed, HttpOnly cookie —
 * never a token the frontend can read or store itself.
 *
 * @returns {import('express').RequestHandler}
 */
export function buildSessionMiddleware() {
  const store = new RedisStore({ client: redisClient, prefix: 'sess:' });

  return session({
    store,
    name: config.session.cookieName,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: config.session.maxAgeMs,
      ...(config.session.cookieDomain ? { domain: config.session.cookieDomain } : {}),
    },
  });
}
