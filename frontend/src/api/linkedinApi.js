import { apiClient } from './client.js';

/** @returns {Promise<{ connected: boolean, connectedAt?: string, status?: string }>} */
export function getLinkedInStatus() {
  return apiClient.get('/api/linkedin/status');
}

/** @returns {Promise<{ connected: false }>} */
export function disconnectLinkedIn() {
  return apiClient.delete('/api/linkedin/disconnect');
}

/**
 * `GET /api/linkedin/connect` is a 302 redirect to LinkedIn's own
 * authorization screen (API.md) — this is a full browser navigation,
 * never a fetch/XHR call.
 */
export function getLinkedInConnectUrl() {
  return '/api/linkedin/connect';
}
