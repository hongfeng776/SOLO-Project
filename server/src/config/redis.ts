import Redis from 'ioredis';
import config from './index';
import Logger from '../utils/logger';

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
};

const redis = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
} as any);

redis.on('connect', () => {
  Logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
  Logger.error('Redis connection error:', err);
});

redis.on('ready', () => {
  Logger.info('Redis is ready');
});

export { redis, redisConfig };
export default redis;
