import { sendSuccess } from '../utils/apiError.js';
import config from '../config/index.js';

const startTime = Date.now();

export function getHealth(req, res) {
  return sendSuccess(res, {
    status: 'healthy',
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: config.env,
  });
}
