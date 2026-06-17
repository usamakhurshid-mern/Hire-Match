import { scoreMatch } from './scoring.service.js';
import * as matchRepo from '../repositories/match.repository.js';
import * as usageRepo from '../repositories/usage.repository.js';

export async function createMatchScore({ user, plan, resumeText, jobDescriptionText, options }) {
  const start = Date.now();

  const planFeatures = plan.features || {};
  const effectiveOptions = {
    ...options,
    includeExplanation:
      planFeatures.includeExplanation !== false && options.includeExplanation !== false,
  };

  if (!planFeatures.customWeights && options.weights) {
    effectiveOptions.weights = undefined;
  }

  const result = scoreMatch(resumeText, jobDescriptionText, effectiveOptions);
  const processingTimeMs = Date.now() - start;

  result.metadata.processingTimeMs = processingTimeMs;

  await matchRepo.saveMatchResult({
    userId: user.id,
    matchId: result.matchId,
    overallScore: result.overallScore,
    responsePayload: result,
    processingTimeMs,
    planName: plan.name,
  });

  await usageRepo.incrementUsage(user.id, 'match');

  return result;
}

export async function getUsageStats(userId, plan) {
  const usage = await usageRepo.getMonthlyUsage(userId);
  const used = usage.total_calls || 0;

  return {
    plan: plan.name,
    rapidapiPlan: plan.rapidapi_plan_id,
    period: usage.year_month || new Date().toISOString().slice(0, 7),
    usage: {
      totalCalls: used,
      matchCalls: usage.match_calls || 0,
      remaining: Math.max(0, plan.monthly_quota - used),
      limit: plan.monthly_quota,
    },
    features: plan.features,
  };
}
