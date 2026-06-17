import { query } from '../config/database.js';

export async function saveMatchResult({ userId, matchId, overallScore, responsePayload, processingTimeMs, planName }) {
  const result = await query(
    `INSERT INTO match_results (user_id, match_id, overall_score, response_payload, processing_time_ms, plan_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, matchId, overallScore, JSON.stringify(responsePayload), processingTimeMs, planName]
  );
  return result.rows[0];
}
