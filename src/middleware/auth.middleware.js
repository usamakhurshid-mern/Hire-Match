import config from '../config/index.js';
import { sendError } from '../utils/apiError.js';
import * as userRepo from '../repositories/user.repository.js';

const PLAN_HEADER = 'x-rapidapi-subscription';

export async function rapidApiAuth(req, res, next) {
  try {
    const proxySecret = (req.headers['x-rapidapi-proxy-secret'] || '').trim();
    const isRapidApiRequest = Boolean(proxySecret);

    if (config.requireRapidApiProxy && !isRapidApiRequest) {
      return sendError(res, 403, 'FORBIDDEN', 'Direct access not allowed. Use RapidAPI.');
    }

    if (isRapidApiRequest) {
      if (!config.rapidApiProxySecret) {
        return sendError(
          res,
          500,
          'CONFIG_ERROR',
          'RAPIDAPI_PROXY_SECRET is not configured on the server',
        );
      }
      if (proxySecret !== config.rapidApiProxySecret) {
        return sendError(res, 403, 'FORBIDDEN', 'Invalid proxy secret');
      }
    }

    const rapidApiUser = req.headers['x-rapidapi-user'] || 'anonymous';
    const planHeader = (req.headers[PLAN_HEADER] || 'BASIC').toUpperCase();

    const { user, plan } = await userRepo.findOrCreateUserWithPlan(rapidApiUser, planHeader);

    res.locals.user = user;
    res.locals.plan = plan;
    res.locals.isRapidApiRequest = isRapidApiRequest;

    next();
  } catch (err) {
    next(err);
  }
}
