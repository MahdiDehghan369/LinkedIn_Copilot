import { UserModel } from './users.model.js';
import { UserRepository } from './users.repository.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { updateProfileSchema } from './users.validation.js';

/**
 * `userModel` is `type: 'model'` — the module manager registers the
 * Mongoose model class itself rather than instantiating it (see
 * module-manager.js `#instantiateSingleton`: `type === 'model' ? Class :
 * new Class(...)`), so `userRepository` receives the actual Mongoose
 * Model as its dependency.
 *
 * @type {Array<object>}
 */
export const usersModuleConfigs = [
  {
    key: 'userModel',
    type: 'model',
    Class: UserModel,
    dependencies: [],
  },
  {
    key: 'userRepository',
    type: 'repository',
    Class: UserRepository,
    dependencies: ['userModel'],
  },
  {
    key: 'usersService',
    type: 'service',
    Class: UsersService,
    dependencies: ['userRepository'],
  },
  {
    key: 'usersController',
    type: 'controller',
    Class: UsersController,
    dependencies: ['usersService'],
  },
  {
    key: 'updateProfileSchema',
    type: 'schema',
    schema: updateProfileSchema,
  },
];

/** @type {{ configs: { prefix: string, controller: string }, routes: Array<object> }} */
export const usersRoutes = {
  configs: { prefix: '/api/users', controller: 'usersController' },
  routes: [
    {
      url: '/me',
      httpMethod: 'get',
      methodName: 'getMe',
      middlewares: [{ name: 'requireAuth' }],
    },
    {
      url: '/me',
      httpMethod: 'patch',
      methodName: 'updateMe',
      middlewares: [
        { name: 'requireAuth' },
        { name: 'validate', args: ['updateProfileSchema', 'body'] },
      ],
    },
  ],
};
