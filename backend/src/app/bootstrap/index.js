import AppBuilder from '@silay/core';
import { coreModuleConfigs, healthRoutes } from '../middleware/core.module.js';
import { usersModuleConfigs, usersRoutes } from '../../modules/users/users.module.js';
import { authModuleConfigs, authRoutes } from '../../modules/auth/auth.module.js';
import { notificationsModuleConfigs, notificationsRoutes } from '../../modules/notifications/notifications.module.js';
import { linkedinModuleConfigs, linkedinRoutes } from '../../modules/linkedin/linkedin.module.js';
import { aiModuleConfigs, aiRoutes } from '../../modules/ai/ai.module.js';
import { postsModuleConfigs, postsRoutes } from '../../modules/posts/posts.module.js';
import { contentModuleConfigs, contentRoutes } from '../../modules/content/content.module.js';
import { analyticsModuleConfigs, analyticsRoutes } from '../../modules/analytics/analytics.module.js';

export function buildApp() {
  const builder = new AppBuilder();

  builder.registerModuleConfigs([
    ...coreModuleConfigs,
    ...usersModuleConfigs,
    ...authModuleConfigs,
    ...notificationsModuleConfigs,
    ...linkedinModuleConfigs,
    ...aiModuleConfigs,
    ...postsModuleConfigs,
    ...contentModuleConfigs,
    ...analyticsModuleConfigs,
  ]);

  builder
    .use('corsMiddleware')
    .use('sessionMiddleware')
    .withErrorHandler('errorHandler')
    .buildRoutes([
      healthRoutes,
      authRoutes,
      usersRoutes,
      notificationsRoutes,
      linkedinRoutes,
      aiRoutes,
      postsRoutes,
      contentRoutes,
      analyticsRoutes,
    ]);

  return builder.getApp();
}
