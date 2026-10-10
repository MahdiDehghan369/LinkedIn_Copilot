import cors from 'cors';
import { config } from '../../infrastructure/config/env.js';

/**
 * Cookies are cross-origin (frontend on one port, API on another in dev),
 * so `credentials: true` plus an exact origin (never `*`) is required for
 * the browser to send/accept the session cookie at all.
 * @returns {import('express').RequestHandler}
 */
export function buildCorsMiddleware() {
  return cors({
    origin: config.cors.origin,
    credentials: true,
  });
}
