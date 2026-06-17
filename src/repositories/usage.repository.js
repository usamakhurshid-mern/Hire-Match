import { query } from '../config/database.js';

function currentYearMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getMonthlyUsage(userId) {
  const yearMonth = currentYearMonth();
  const result = await query(
    'SELECT * FROM usage_monthly WHERE user_id = $1 AND year_month = $2',
    [userId, yearMonth]
  );
  return result.rows[0] || { year_month: yearMonth, match_calls: 0, total_calls: 0 };
}

export async function incrementUsage(userId, type = 'match') {
  const yearMonth = currentYearMonth();
  const result = await query(
    `INSERT INTO usage_monthly (user_id, year_month, match_calls, total_calls)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (user_id, year_month)
     DO UPDATE SET
       match_calls = usage_monthly.match_calls + $3,
       total_calls = usage_monthly.total_calls + 1
     RETURNING *`,
    [userId, yearMonth, type === 'match' ? 1 : 0]
  );
  return result.rows[0];
}

export async function logRequest({ userId, endpoint, method, statusCode, latencyMs, requestId, planName }) {
  await query(
    `INSERT INTO api_requests (user_id, endpoint, method, status_code, latency_ms, request_id, plan_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, endpoint, method, statusCode, latencyMs, requestId, planName]
  );
}
