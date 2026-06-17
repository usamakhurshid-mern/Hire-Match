import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
