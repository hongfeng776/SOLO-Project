import Redis from 'ioredis';
import { redisConfig } from './index';

const redis = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
});

redis.on('connect', () => {
  console.log('Redis connection has been established successfully.');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

export default redis;
