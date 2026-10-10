import { AppError } from '../../shared/errors/index.js';

/** LinkedIn rejected/expired the access token. */
export class LinkedInAuthError extends AppError {
  constructor(message = 'LinkedIn authentication failed. Please reconnect your account.') {
    super(message, 401, 'LINKEDIN_AUTH_ERROR');
  }
}

/** LinkedIn's own rate limit was hit (as opposed to our own pre-emptive one). */
export class LinkedInRateLimitError extends AppError {
  constructor(message = 'LinkedIn rate limit reached. Please try again shortly.') {
    super(message, 429, 'LINKEDIN_RATE_LIMIT');
  }
}

/** LinkedIn rejected the request content/shape — not retryable as-is. */
export class LinkedInValidationError extends AppError {
  constructor(message = 'LinkedIn rejected this request.') {
    super(message, 400, 'LINKEDIN_VALIDATION_ERROR');
  }
}

/** Anything else LinkedIn-side (5xx, network failure, unexpected shape). */
export class LinkedInApiError extends AppError {
  constructor(message = 'LinkedIn is temporarily unavailable.') {
    super(message, 502, 'LINKEDIN_API_ERROR');
  }
}

/** The user has no (active) LinkedIn connection to act on. */
export class LinkedInNotConnectedError extends AppError {
  constructor(message = 'Connect your LinkedIn account first.') {
    super(message, 409, 'LINKEDIN_NOT_CONNECTED');
  }
}
