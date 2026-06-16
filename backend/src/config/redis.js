const { createClient } = require('redis');
const config = require('./index');

let redisClient = null;

const initRedis = async () => {
  const redisConfig = {
    socket: {
      host: config.redis.host,
      port: config.redis.port,
    },
    database: config.redis.db,
  };

  if (config.redis.password) {
    redisConfig.password = config.redis.password;
  }

  redisClient = createClient(redisConfig);

  redisClient.on('error', (err) => {
    console.error('[Redis] Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Redis Client connected.');
  });

  try {
    await redisClient.connect();
    console.log('[Redis] Redis connection has been established successfully.');
  } catch (error) {
    console.error('[Redis] Unable to connect to Redis:', error);
  }

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client is not initialized');
  }
  return redisClient;
};

const setCache = async (key, value, ttl = 3600) => {
  const client = getRedisClient();
  const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
  await client.set(key, serializedValue, { EX: ttl });
};

const getCache = async (key) => {
  const client = getRedisClient();
  const value = await client.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const deleteCache = async (key) => {
  const client = getRedisClient();
  await client.del(key);
};

module.exports = {
  initRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
};
