import { query } from '../config/database.js';
import * as planRepo from './plan.repository.js';

export async function findOrCreateUserWithPlan(rapidapiUser, planHeader) {
  const plan = await planRepo.findPlanByRapidApiId(planHeader);
  if (!plan) {
    throw new Error(`Unknown plan: ${planHeader}`);
  }

  let userResult = await query('SELECT * FROM users WHERE rapidapi_user = $1', [rapidapiUser]);

  let user;
  if (userResult.rows.length === 0) {
    userResult = await query(
      `INSERT INTO users (rapidapi_user) VALUES ($1) RETURNING *`,
      [rapidapiUser]
    );
    user = userResult.rows[0];

    await query(
      `INSERT INTO subscriptions (user_id, plan_id) VALUES ($1, $2)`,
      [user.id, plan.id]
    );
  } else {
    user = userResult.rows[0];
    const subUpdate = await query(
      `UPDATE subscriptions SET plan_id = $1 WHERE user_id = $2`,
      [plan.id, user.id]
    );
    if (subUpdate.rowCount === 0) {
      await query(`INSERT INTO subscriptions (user_id, plan_id) VALUES ($1, $2)`, [
        user.id,
        plan.id,
      ]);
    }
  }

  return { user, plan };
}

export async function findById(userId) {
  const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0] || null;
}
