import { apiClient } from './client.js';

/**
 * @param {{ count?: number, topicHint?: string }} input
 * @returns {Promise<{ ideas: Array<object> }>}
 */
export function generateIdeas(input) {
  return apiClient.post('/api/ai/ideas', input);
}

/**
 * @param {{ topic: string, tone?: string, audience?: string, length?: 'short'|'medium'|'long' }} input
 * @returns {Promise<{ post: { hook: string, body: string, cta: string, hashtags: string[] } }>}
 */
export function generatePost(input) {
  return apiClient.post('/api/ai/posts/generate', input);
}

/**
 * @param {{ content: string }} input
 * @returns {Promise<{ scores: object, improved: object }>}
 */
export function improvePost(input) {
  return apiClient.post('/api/ai/posts/improve', input);
}

/**
 * @param {{ samplePosts: string[] }} input
 * @returns {Promise<{ profile: object }>}
 */
export function analyzeWritingStyle(input) {
  return apiClient.post('/api/ai/analyze', input);
}
