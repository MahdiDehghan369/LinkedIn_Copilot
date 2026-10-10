/**
 * @file Single source of truth for query keys. Every hook builds its keys
 * from here so invalidation (e.g. "refetch the posts list after creating
 * a post") can't drift out of sync between files.
 */
export const queryKeys = {
  me: ['me'],
  notifications: (query) => ['notifications', query ?? {}],
  linkedinStatus: ['linkedin', 'status'],
  posts: (query) => ['posts', query ?? {}],
  post: (id) => ['posts', id],
  ideas: (query) => ['ideas', query ?? {}],
  calendar: (weekStart) => ['calendar', weekStart],
  contentGaps: ['content', 'gaps'],
  analyticsOverview: ['analytics', 'overview'],
  postAnalytics: (postId) => ['analytics', 'post', postId],
};
