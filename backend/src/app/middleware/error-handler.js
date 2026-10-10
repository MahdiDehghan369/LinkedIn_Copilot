import { AppError } from '../../shared/errors/index.js';
import { config } from '../../infrastructure/config/env.js';
import { logger } from '../../infrastructure/logger/index.js';

const GENERIC_MESSAGE = 'Something went wrong. Please try again later.';

/**
 * Registered as the Silay `errorHandler` module item (dependencies: []),
 * so the framework uses this exact 4-arg function directly rather than a
 * DI-wrapped factory — see AppBuilder.withErrorHandler(). Every response
 * this produces has the shape `{ message, code }` (requirement #11), and
 * stack traces never reach the client in production (requirement #42).
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isAppError ? err.message : GENERIC_MESSAGE;

  const logFields = {
    requestId: req.trackingHeaders?.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    userId: req.userId,
    error: err,
  };

  if (statusCode >= 500) {
    logger.error('Request failed', logFields);
  } else {
    logger.warn('Request rejected', logFields);
  }

  const body = { message, code };
  if (isAppError && err.details?.length) {
    body.details = err.details;
  }
  if (!config.isProduction && !isAppError) {
    body.stack = err.stack;
  }

  if (typeof res.sendResponse === 'function') {
    res.sendResponse(statusCode, body);
  } else {
    res.status(statusCode).json(body);
  }
}
