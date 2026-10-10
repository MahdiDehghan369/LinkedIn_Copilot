import { AppError } from '../../shared/errors/index.js';

/** The AI provider itself failed (network error, non-2xx, missing config). */
export class AIProviderError extends AppError {
  constructor(message = 'The AI provider is temporarily unavailable.') {
    super(message, 502, 'AI_PROVIDER_ERROR');
  }
}

/**
 * The provider responded, but its output didn't match the schema the
 * application expects — the "never trust the model's output shape
 * blindly" validation step (architecture doc §G) failed.
 */
export class AIResponseValidationError extends AppError {
  constructor(message = 'The AI returned an unexpected response format. Please try again.') {
    super(message, 502, 'AI_RESPONSE_INVALID');
  }
}
