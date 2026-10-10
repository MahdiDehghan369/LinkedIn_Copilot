import { errorHandler } from './error-handler.js';
import { validate } from './validate.js';
import { buildSessionMiddleware } from './session.js';
import { buildCorsMiddleware } from './cors.js';
import { HealthController } from '../routes/health.controller.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';

/**
 * Cross-cutting items that don't belong to any single business module:
 * the centralized error handler, the generic `validate` middleware
 * factory, the session/CORS global middlewares, the health-check
 * controller, and the shared RedisService abstraction.
 *
 * @type {Array<object>}
 */
export const coreModuleConfigs = [
  {
    key: 'errorHandler',
    type: 'middleware',
    dependencies: [],
    fn: errorHandler,
  },
  {
    key: 'validate',
    type: 'middleware',
    dependencies: [],
    fn: validate,
  },
  {
    key: 'sessionMiddleware',
    type: 'middleware',
    dependencies: [],
    fn: buildSessionMiddleware(),
  },
  {
    key: 'corsMiddleware',
    type: 'middleware',
    dependencies: [],
    fn: buildCorsMiddleware(),
  },
  {
    key: 'redisService',
    type: 'service',
    Class: RedisService,
    dependencies: [],
  },
  {
    key: 'healthController',
    type: 'controller',
    Class: HealthController,
    dependencies: [],
  },
];

/** @type {{ configs: { prefix: string, controller: string }, routes: Array<object> }} */
export const healthRoutes = {
  configs: { prefix: '/api', controller: 'healthController' },
  routes: [{ url: '/health', httpMethod: 'get', methodName: 'check' }],
};
