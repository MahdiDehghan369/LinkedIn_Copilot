import { ValidationError } from '../../shared/errors/index.js';

/**
 * Factory used by Silay's RouterManager for any route middleware named
 * "validate": `{ name: 'validate', args: ['someBodySchema', 'body'] }`.
 * RouterManager resolves `args[0]` as a container-registered `schema`
 * item and calls this factory as `validate(schema, source)`, so `fn` here
 * must be exactly that two-argument factory — see router-manager.js.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 * @returns {import('express').RequestHandler}
 */
export function validate(schema, source = 'body') {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      next(new ValidationError('Invalid request data.', details));
      return;
    }
    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      req[source] = result.data;
    }
    next();
  };
}
