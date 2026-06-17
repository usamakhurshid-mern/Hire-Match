import { sendError } from '../utils/apiError.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        issue: d.type.split('.').pop(),
        message: d.message,
      }));
      return sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details);
    }

    req.validatedBody = value;
    next();
  };
}
