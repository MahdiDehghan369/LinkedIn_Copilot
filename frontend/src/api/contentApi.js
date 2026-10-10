import { apiClient, toQueryString } from './client.js';

/** @param {{ status?: 'proposed'|'used'|'dismissed' }} [query] */
export function listIdeas(query = {}) {
  return apiClient.get(`/api/content/ideas${toQueryString(query)}`);
}

/**
 * @param {{ title: string, hook?: string, coreIdea?: string, contentType?: string,
 *   audience?: string, suggestedCta?: string, suggestedHashtags?: string[] }} input
 */
export function saveIdea(input) {
  return apiClient.post('/api/content/ideas', input);
}

/**
 * @param {string} id
 * @param {'used'|'dismissed'} status
 */
export function updateIdeaStatus(id, status) {
  return apiClient.patch(`/api/content/ideas/${id}`, { status });
}

/** @param {string} weekStart ISO date, e.g. '2026-08-24' */
export function getCalendar(weekStart) {
  return apiClient.get(`/api/content/calendar${toQueryString({ week: weekStart })}`);
}

/**
 * @param {{ weekStart: string, slots?: object[], preferences?: object }} input
 */
export function upsertCalendar(input) {
  return apiClient.put('/api/content/calendar', input);
}

/** @returns {Promise<{ gaps: Array<{ topic: string, count: number, level: string }> }>} */
export function getContentGaps() {
  return apiClient.get('/api/content/gaps');
}
