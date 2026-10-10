import { apiClient } from './client.js';

/** @returns {Promise<{ totalPosts: number, totalImpressions: number, averageEngagementRate: number|null, bestPerformingPost: object|null }>} */
export function getAnalyticsOverview() {
  return apiClient.get('/api/analytics/overview');
}

/** @param {string} postId */
export function getPostAnalytics(postId) {
  return apiClient.get(`/api/analytics/posts/${postId}`);
}

/** @param {string} postId */
export function refreshPostAnalytics(postId) {
  return apiClient.post(`/api/analytics/posts/${postId}/refresh`);
}

/** @param {string} postId */
export function getPerformanceInsight(postId) {
  return apiClient.post(`/api/analytics/posts/${postId}/insights`);
}
