import { createClient } from 'redis';
import config from './index.js';
import logger from '../utils/logger.js';

let client;

export async function getRedis() {
  if (!client) {
    client = createClient({ url: config.redisUrl });
    client.on('error', (err) => logger.error('Redis error', { error: err.message }));
    await client.connect();
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
