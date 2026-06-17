import { getRedis } from '../config/redis.js';
import { sendError } from '../utils/apiError.js';
import config from '../config/index.js';

const memoryBuckets = new Map();

function memoryRateLimit(key, limit) {
  const window = Math.floor(Date.now() / 60000);
  const bucketKey = `${key}:${window}`;
  const count = (memoryBuckets.get(bucketKey) || 0) + 1;
  memoryBuckets.set(bucketKey, count);
  return { count, remaining: Math.max(0, limit - count) };
}

export function rateLimitMiddleware(req, res, next) {
  const plan = res.locals.plan;
  if (!plan) {
    return next();
  }

  const user = res.locals.user;
  const limit = plan.rate_limit_per_min;
  const windowKey = `ratelimit:${user.id}:${Math.floor(Date.now() / 60000)}`;
  const reset = Math.ceil(Date.now() / 60000) * 60000;

  const applyLimit = (count) => {
    const remaining = Math.max(0, limit - count);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (count > limit) {
      return sendError(res, 429, 'RATE_LIMITED', `Rate limit exceeded. Max ${limit} requests per minute.`);
    }
    next();
  };

  getRedis()
    .then(async (redis) => {
      const count = await redis.incr(windowKey);
      if (count === 1) {
        await redis.expire(windowKey, 60);
      }
      applyLimit(count);
    })
    .catch(() => {
      if (config.env === 'production') {
        return sendError(res, 503, 'SERVICE_UNAVAILABLE', 'Rate limiting service unavailable');
      }
      const { count } = memoryRateLimit(windowKey, limit);
      applyLimit(count);
    });
}
