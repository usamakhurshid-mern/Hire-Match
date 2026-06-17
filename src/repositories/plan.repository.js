import { query } from '../config/database.js';

const PLAN_MAP = {
  BASIC: 'basic',
  PRO: 'pro',
  ULTRA: 'ultra',
  MEGA: 'mega',
  CUSTOM: 'ultra',
};

export async function findPlanByRapidApiId(rapidapiPlanId) {
  const planKey = PLAN_MAP[rapidapiPlanId?.toUpperCase()] || 'basic';
  const result = await query('SELECT * FROM plans WHERE name = $1', [planKey]);
  return result.rows[0] || null;
}

export async function findPlanByName(name) {
  const result = await query('SELECT * FROM plans WHERE name = $1', [name]);
  return result.rows[0] || null;
}

export async function getAllPlans() {
  const result = await query('SELECT * FROM plans ORDER BY monthly_quota ASC');
  return result.rows;
}
