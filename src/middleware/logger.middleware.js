import logger from '../utils/logger.js';

export function loggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    logger.info('request', {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latencyMs: Date.now() - start,
      plan: res.locals.plan?.name,
      user: res.locals.user?.rapidapi_user,
    });
  });

  next();
}
