import { LinkedInAccountModel } from './linkedin.model.js';
import { LinkedInAccountRepository } from './linkedin.repository.js';
import { LinkedInClient } from './linkedin.client.js';
import { LinkedInService } from './linkedin.service.js';
import { LinkedInController } from './linkedin.controller.js';

/**
 * `linkedinService` depends on `redisService`, which is registered by the
 * `core` module — the same cross-module DI pattern as `auth`'s
 * dependency on `users`' `userRepository` (see auth.module.js).
 *
 * @type {Array<object>}
 */
export const linkedinModuleConfigs = [
  {
    key: 'linkedInAccountModel',
    type: 'model',
    Class: LinkedInAccountModel,
    dependencies: [],
  },
  {
    key: 'linkedInAccountRepository',
    type: 'repository',
    Class: LinkedInAccountRepository,
    dependencies: ['linkedInAccountModel'],
  },
  {
    key: 'linkedinClient',
    type: 'service',
    Class: LinkedInClient,
    dependencies: [],
  },
  {
    key: 'linkedinService',
    type: 'service',
    Class: LinkedInService,
    dependencies: ['linkedInAccountRepository', 'linkedinClient', 'redisService', 'notificationService'],
  },
  {
    key: 'linkedinController',
    type: 'controller',
    Class: LinkedInController,
    dependencies: ['linkedinService'],
  },
];

/** @type {{ configs: { prefix: string, controller: string }, routes: Array<object> }} */
export const linkedinRoutes = {
  configs: { prefix: '/api/linkedin', controller: 'linkedinController' },
  routes: [
    {
      url: '/connect',
      httpMethod: 'get',
      methodName: 'connect',
      middlewares: [{ name: 'requireAuth' }],
    },
    {
      url: '/callback',
      httpMethod: 'get',
      methodName: 'callback',
      middlewares: [],
    },
    {
      url: '/status',
      httpMethod: 'get',
      methodName: 'status',
      middlewares: [{ name: 'requireAuth' }],
    },
    {
      url: '/disconnect',
      httpMethod: 'delete',
      methodName: 'disconnect',
      middlewares: [{ name: 'requireAuth' }],
    },
  ],
};
