import { ApiError, sendError } from '../utils/apiError.js';
import logger from '../utils/logger.js';

export function notFoundHandler(req, res) {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  logger.error('Unhandled error', {
    requestId: res.locals.requestId,
    error: err.message,
    stack: err.stack,
  });

  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
