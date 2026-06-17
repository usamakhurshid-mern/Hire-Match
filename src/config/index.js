import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  rapidApiProxySecret: process.env.RAPIDAPI_PROXY_SECRET || '',
  requireRapidApiProxy: process.env.REQUIRE_RAPIDAPI_PROXY === 'true',
  runMigrations: process.env.RUN_MIGRATIONS === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
