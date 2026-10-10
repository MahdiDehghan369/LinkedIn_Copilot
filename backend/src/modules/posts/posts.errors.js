import { AppError } from '../../shared/errors/index.js';

export class InvalidTransitionError extends AppError {
  constructor(message = 'This action is not valid for the post\u2019s current status.') {
    super(message, 409, 'INVALID_POST_TRANSITION');
  }
}
