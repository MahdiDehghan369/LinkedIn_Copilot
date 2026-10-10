import { apiClient, toQueryString } from './client.js';

/**
 * @param {{ unread?: boolean }} [query]
 * @returns {Promise<{ notifications: Array<object> }>}
 */
export function listNotifications(query = {}) {
  return apiClient.get(`/api/notifications${toQueryString(query)}`);
}

/**
 * @param {string} id
 * @returns {Promise<{ notification: object }>}
 */
export function markNotificationRead(id) {
  return apiClient.patch(`/api/notifications/${id}/read`);
}
