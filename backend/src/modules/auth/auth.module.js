import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';
import { buildAuthRateLimiter } from './auth.rate-limiter.js';
import { registerSchema, loginSchema } from './auth.validation.js';

/**
 * `authService` depends on `userRepository`, which is registered by the
 * `users` module — this is normal cross-module service consumption
 * through the shared DI container, not a violation of "don't reach into
 * another module's model" (architecture doc §7): auth never imports
 * `users.model.js`, only the repository class users already exposes.
 *
 * @type {Array<object>}
 */
export const authModuleConfigs = [
  {
    key: 'authService',
    type: 'service',
    Class: AuthService,
    dependencies: ['userRepository'],
  },
  {
    key: 'authController',
    type: 'controller',
    Class: AuthController,
    dependencies: ['authService'],
  },
  {
    key: 'requireAuth',
    type: 'middleware',
    dependencies: [],
    fn: requireAuth,
  },
  {
    key: 'authRateLimiter',
    type: 'middleware',
    dependencies: ['redisService'],
    fn: buildAuthRateLimiter,
  },
  {
    key: 'registerSchema',
    type: 'schema',
    schema: registerSchema,
  },
  {
    key: 'loginSchema',
    type: 'schema',
    schema: loginSchema,
  },
];

/** @type {{ configs: { prefix: string, controller: string }, routes: Array<object> }} */
export const authRoutes = {
  configs: { prefix: '/api/auth', controller: 'authController' },
  routes: [
    {
      url: '/register',
      httpMethod: 'post',
      methodName: 'register',
      middlewares: [{ name: 'authRateLimiter' }, { name: 'validate', args: ['registerSchema', 'body'] }],
    },
    {
      url: '/login',
      httpMethod: 'post',
      methodName: 'login',
      middlewares: [{ name: 'authRateLimiter' }, { name: 'validate', args: ['loginSchema', 'body'] }],
    },
    {
      url: '/logout',
      httpMethod: 'post',
      methodName: 'logout',
      middlewares: [],
    },
  ],
};
