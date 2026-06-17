import { sendSuccess } from '../utils/apiError.js';
import * as matchService from '../services/match.service.js';

export async function scoreMatch(req, res, next) {
  const start = Date.now();
  try {
    const { resumeText, jobDescriptionText, options } = req.validatedBody;
    const result = await matchService.createMatchScore({
      user: res.locals.user,
      plan: res.locals.plan,
      resumeText,
      jobDescriptionText,
      options,
    });

    res.locals.logRequest = {
      endpoint: '/v1/match/score',
      statusCode: 200,
      latencyMs: Date.now() - start,
    };

    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getUsage(req, res, next) {
  try {
    const stats = await matchService.getUsageStats(res.locals.user.id, res.locals.plan);
    return sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}
