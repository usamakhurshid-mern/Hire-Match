import { sendError } from '../utils/apiError.js';
import * as usageRepo from '../repositories/usage.repository.js';

export async function quotaMiddleware(req, res, next) {
  try {
    const user = res.locals.user;
    const plan = res.locals.plan;

    if (!user || !plan) {
      return next();
    }

    const usage = await usageRepo.getMonthlyUsage(user.id);
    const used = usage?.total_calls || 0;

    res.setHeader('X-Quota-Limit', plan.monthly_quota);
    res.setHeader('X-Quota-Used', used);
    res.setHeader('X-Quota-Remaining', Math.max(0, plan.monthly_quota - used));

    if (used >= plan.monthly_quota) {
      return sendError(
        res,
        402,
        'QUOTA_EXCEEDED',
        `Monthly quota exceeded. Plan allows ${plan.monthly_quota} requests per month.`
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
