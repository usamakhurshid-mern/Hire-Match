import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import config from './config/index.js';
import { getPool, closePool, query } from './config/database.js';
import { getRedis, closeRedis } from './config/redis.js';
import logger from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrationsIfNeeded() {
  if (!config.runMigrations) return;

  const migrationPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  await query(sql);
  logger.info('Database migrations applied');
}

async function start() {
  try {
    await getPool().query('SELECT 1');
    logger.info('PostgreSQL connected');

    await runMigrationsIfNeeded();

    try {
      await getRedis();
      logger.info('Redis connected');
    } catch (redisErr) {
      logger.warn('Redis unavailable — rate limiting will fail until Redis is up', {
        error: redisErr.message,
      });
    }

    const server = app.listen(config.port, () => {
      logger.info(`HireMatch API listening on port ${config.port}`, {
        env: config.env,
        requireRapidApiProxy: config.requireRapidApiProxy,
        rapidApiSecretConfigured: Boolean(config.rapidApiProxySecret),
        rapidApiSecretLength: config.rapidApiProxySecret.length,
      });
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down`);
      server.close(async () => {
        await closePool();
        await closeRedis();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
