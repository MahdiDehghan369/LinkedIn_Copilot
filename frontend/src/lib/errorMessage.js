import { ApiError } from '../api/client.js';

const FRIENDLY_MESSAGES = {
  VALIDATION_ERROR: null, // use the backend's own message — it's already specific
  AUTHENTICATION_ERROR: 'Please log in again.',
  NOT_FOUND: 'That item could not be found.',
  CONFLICT: null,
  INVALID_POST_TRANSITION: null,
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please wait a moment and try again.',
  LINKEDIN_AUTH_ERROR: 'Your LinkedIn connection needs to be refreshed. Please reconnect.',
  LINKEDIN_RATE_LIMIT: 'LinkedIn rate limit reached. Please try again shortly.',
  LINKEDIN_VALIDATION_ERROR: null,
  LINKEDIN_API_ERROR: 'LinkedIn is temporarily unavailable.',
  LINKEDIN_NOT_CONNECTED: 'Connect your LinkedIn account first.',
  AI_PROVIDER_ERROR: null,
  AI_RESPONSE_INVALID: 'The AI returned an unexpected response. Please try again.',
};

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return FRIENDLY_MESSAGES[error.code] ?? error.message ?? 'Something went wrong.';
  }
  return 'Something went wrong. Please try again.';
}
