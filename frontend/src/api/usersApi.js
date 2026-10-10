import { apiClient } from './client.js';

/** @typedef {{ language: string, tone: string, audience: string, postingFrequency: string, emojiUsage: string }} Preferences */
/** @typedef {{ model: string, creativity: string }} AiSettings */
/** @typedef {{ id: string, email: string, name: string, preferences: Preferences, aiSettings: AiSettings, createdAt: string }} UserProfile */

/** @returns {Promise<{ user: UserProfile }>} */
export function getMe() {
  return apiClient.get('/api/users/me');
}

/**
 * @param {{ name?: string, preferences?: Partial<Preferences>, aiSettings?: Partial<AiSettings> }} patch
 * @returns {Promise<{ user: UserProfile }>}
 */
export function updateMe(patch) {
  return apiClient.patch('/api/users/me', patch);
}
