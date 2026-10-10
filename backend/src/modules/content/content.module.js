import { ContentIdeaModel } from './content-idea.model.js';
import { ContentIdeaRepository } from './content-idea.repository.js';
import { ContentCalendarModel } from './content-calendar.model.js';
import { ContentCalendarRepository } from './content-calendar.repository.js';
import { ContentService } from './content.service.js';
import { ContentController } from './content.controller.js';
import {
  saveIdeaSchema,
  listIdeasQuerySchema,
  updateIdeaStatusSchema,
  upsertCalendarSchema,
  getCalendarQuerySchema,
} from './content.validation.js';

/**
 * `contentService` depends on `postsService` (cross-module, read-only —
 * architecture doc §C: `content → users, posts (read-only, for
 * memory/gap analysis)`), the same DI pattern as every other cross-module
 * dependency in this app.
 *
 * @type {Array<object>}
 */
export const contentModuleConfigs = [
  { key: 'contentIdeaModel', type: 'model', Class: ContentIdeaModel, dependencies: [] },
  {
    key: 'contentIdeaRepository',
    type: 'repository',
    Class: ContentIdeaRepository,
    dependencies: ['contentIdeaModel'],
  },
  { key: 'contentCalendarModel', type: 'model', Class: ContentCalendarModel, dependencies: [] },
  {
    key: 'contentCalendarRepository',
    type: 'repository',
    Class: ContentCalendarRepository,
    dependencies: ['contentCalendarModel'],
  },
  {
    key: 'contentService',
    type: 'service',
    Class: ContentService,
    dependencies: ['contentIdeaRepository', 'contentCalendarRepository', 'postsService'],
  },
  { key: 'contentController', type: 'controller', Class: ContentController, dependencies: ['contentService'] },

  { key: 'saveIdeaSchema', type: 'schema', schema: saveIdeaSchema },
  { key: 'listIdeasQuerySchema', type: 'schema', schema: listIdeasQuerySchema },
  { key: 'updateIdeaStatusSchema', type: 'schema', schema: updateIdeaStatusSchema },
  { key: 'upsertCalendarSchema', type: 'schema', schema: upsertCalendarSchema },
  { key: 'getCalendarQuerySchema', type: 'schema', schema: getCalendarQuerySchema },
];

/** @type {{ configs: { prefix: string, controller: string }, routes: Array<object> }} */
export const contentRoutes = {
  configs: { prefix: '/api/content', controller: 'contentController' },
  routes: [
    {
      url: '/ideas',
      httpMethod: 'get',
      methodName: 'listIdeas',
      middlewares: [{ name: 'requireAuth' }, { name: 'validate', args: ['listIdeasQuerySchema', 'query'] }],
    },
    {
      url: '/ideas',
      httpMethod: 'post',
      methodName: 'saveIdea',
      middlewares: [{ name: 'requireAuth' }, { name: 'validate', args: ['saveIdeaSchema', 'body'] }],
    },
    {
      url: '/ideas/:id',
      httpMethod: 'patch',
      methodName: 'updateIdeaStatus',
      middlewares: [{ name: 'requireAuth' }, { name: 'validate', args: ['updateIdeaStatusSchema', 'body'] }],
    },
    {
      url: '/calendar',
      httpMethod: 'get',
      methodName: 'getCalendar',
      middlewares: [{ name: 'requireAuth' }, { name: 'validate', args: ['getCalendarQuerySchema', 'query'] }],
    },
    {
      url: '/calendar',
      httpMethod: 'put',
      methodName: 'upsertCalendar',
      middlewares: [{ name: 'requireAuth' }, { name: 'validate', args: ['upsertCalendarSchema', 'body'] }],
    },
    { url: '/gaps', httpMethod: 'get', methodName: 'getGaps', middlewares: [{ name: 'requireAuth' }] },
  ],
};
