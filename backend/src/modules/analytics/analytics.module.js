import { PostAnalyticsModel } from './post-analytics.model.js';
import { PostAnalyticsRepository } from './post-analytics.repository.js';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsController } from './analytics.controller.js';

/**
 * `analyticsService` depends on `postRepository` (read), `linkedinService`
 * (read metrics), and `aiService` (narrative insight) — matching the
 * architecture doc's dependency table exactly: "analytics → linkedin
 * (read), posts (attach metrics), ai (ask for narrative insight)".
 *
 * @type {Array<object>}
 */
export const analyticsModuleConfigs = [
  { key: 'postAnalyticsModel', type: 'model', Class: PostAnalyticsModel, dependencies: [] },
  {
    key: 'postAnalyticsRepository',
    type: 'repository',
    Class: PostAnalyticsRepository,
    dependencies: ['postAnalyticsModel'],
  },
  {
    key: 'analyticsService',
    type: 'service',
    Class: AnalyticsService,
    dependencies: ['postAnalyticsRepository', 'postRepository', 'linkedinService', 'aiService'],
  },
  {
    key: 'analyticsController',
    type: 'controller',
    Class: AnalyticsController,
    dependencies: ['analyticsService'],
  },
];

/** @type {{ configs: { prefix: string, controller: string }, routes: Array<object> }} */
export const analyticsRoutes = {
  configs: { prefix: '/api/analytics', controller: 'analyticsController' },
  routes: [
    { url: '/overview', httpMethod: 'get', methodName: 'overview', middlewares: [{ name: 'requireAuth' }] },
    {
      url: '/posts/:id',
      httpMethod: 'get',
      methodName: 'getPostAnalytics',
      middlewares: [{ name: 'requireAuth' }],
    },
    {
      url: '/posts/:id/refresh',
      httpMethod: 'post',
      methodName: 'refreshPostAnalytics',
      middlewares: [{ name: 'requireAuth' }],
    },
    {
      url: '/posts/:id/insights',
      httpMethod: 'post',
      methodName: 'getPerformanceInsight',
      middlewares: [{ name: 'requireAuth' }],
    },
  ],
};
