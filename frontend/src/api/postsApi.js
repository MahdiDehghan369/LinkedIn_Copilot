import { apiClient, toQueryString } from './client.js';

/** @typedef {'DRAFT'|'GENERATED'|'EDITED'|'APPROVED'|'SCHEDULED'|'PUBLISHING'|'PUBLISHED'|'FAILED'|'CANCELLED'} PostStatus */

/**
 * @param {{ status?: PostStatus, page?: number, pageSize?: number }} [query]
 * @returns {Promise<{ posts: Array<object>, page: number, pageSize: number, total: number }>}
 */
export function listPosts(query = {}) {
  return apiClient.get(`/api/posts${toQueryString(query)}`);
}

/**
 * @param {{ content?: object, topicTags?: string[], originIdeaId?: string, sourceGenerationId?: string }} input
 * @returns {Promise<{ post: object }>}
 */
export function createPost(input) {
  return apiClient.post('/api/posts', input);
}

/** @param {string} id */
export function getPost(id) {
  return apiClient.get(`/api/posts/${id}`);
}

/**
 * @param {string} id
 * @param {{ content?: object, topicTags?: string[] }} patch
 */
export function updatePost(id, patch) {
  return apiClient.patch(`/api/posts/${id}`, patch);
}

/** @param {string} id */
export function deletePost(id) {
  return apiClient.delete(`/api/posts/${id}`);
}

/** @param {string} id */
export function approvePost(id) {
  return apiClient.post(`/api/posts/${id}/approve`);
}

/** @param {string} id */
export function publishPost(id) {
  return apiClient.post(`/api/posts/${id}/publish`);
}

/**
 * @param {string} id
 * @param {string} scheduledForIso
 */
export function schedulePost(id, scheduledForIso) {
  return apiClient.post(`/api/posts/${id}/schedule`, { scheduledFor: scheduledForIso });
}

/** @param {string} id */
export function cancelPost(id) {
  return apiClient.post(`/api/posts/${id}/cancel`);
}

/**
 * Multipart upload, so it bypasses the JSON `apiClient` and calls
 * `fetch` directly — this is the one deliberate exception to "all API
 * calls go through apiClient", since FormData/JSON are fundamentally
 * different request bodies. `credentials: 'include'` is preserved so
 * the session cookie still applies here exactly like every other call.
 * @param {string} id
 * @param {File} file
 * @returns {Promise<{ post: object }>}
 */
export async function uploadPostImage(id, file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`/api/posts/${id}/image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.message ?? 'Could not upload image.', payload?.code ?? 'UNKNOWN_ERROR', response.status);
  }
  return payload;
}

/** @param {string} id */
export function deletePostImage(id) {
  return apiClient.delete(`/api/posts/${id}/image`);
}

/**
 * For direct use in an `<img src>` — the browser sends the session
 * cookie automatically for same-origin image requests, no extra JS
 * needed (see `vite.config.js`'s dev proxy, which keeps frontend and
 * backend same-origin).
 * @param {string} id
 * @returns {string}
 */
export function getPostImageUrl(id) {
  return `/api/posts/${id}/image`;
}