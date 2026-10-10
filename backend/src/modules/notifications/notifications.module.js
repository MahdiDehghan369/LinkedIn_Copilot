import { NotificationModel } from './notification.model.js';
import { NotificationRepository } from './notification.repository.js';
import { NotificationService } from './notification.service.js';
import { NotificationController } from './notification.controller.js';
import { listNotificationsQuerySchema } from './notification.validation.js';

/**
 * No other module depends on `notificationService` through this DI
 * container — `linkedin.service.js` needs it too (to notify on token
 * expiry), which is why it's registered here in `core`-adjacent position
 * and referenced by key from `linkedin.module.js`'s dependency array,
 * the same cross-module pattern used everywhere else in this app. The
 * worker process (no HTTP routes, no Silay container) constructs its own
 * `NotificationService` instance manually, same as everything else it
 * needs.
 *
 * @type {Array<object>}
 */
export const notificationsModuleConfigs = [
  { key: 'notificationModel', type: 'model', Class: NotificationModel, dependencies: [] },
  {
    key: 'notificationRepository',
    type: 'repository',
    Class: NotificationRepository,
    dependencies: ['notificationModel'],
  },
  {
    key: 'notificationService',
    type: 'service',
    Class: NotificationService,
    dependencies: ['notificationRepository'],
  },
  {
    key: 'notificationController',
    type: 'controller',
    Class: NotificationController,
    dependencies: ['notificationService'],
  },
  { key: 'listNotificationsQuerySchema', type: 'schema', schema: listNotificationsQuerySchema },
];

/** @type {{ configs: { prefix: string, controller: string }, routes: Array<object> }} */
export const notificationsRoutes = {
  configs: { prefix: '/api/notifications', controller: 'notificationController' },
  routes: [
    {
      url: '/',
      httpMethod: 'get',
      methodName: 'list',
      middlewares: [{ name: 'requireAuth' }, { name: 'validate', args: ['listNotificationsQuerySchema', 'query'] }],
    },
    {
      url: '/:id/read',
      httpMethod: 'patch',
      methodName: 'markRead',
      middlewares: [{ name: 'requireAuth' }],
    },
  ],
};
