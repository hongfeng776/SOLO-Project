﻿const { createClient } = require('redis');
const config = require('./index');

let redisClient = null;
let redisAvailable = false;

const initRedis = async () => {
  const redisConfig = {
    socket: {
      host: config.redis.host,
      port: config.redis.port,
      reconnectStrategy: () => null,
    },
    database: config.redis.db,
  };

  if (config.redis.password) {
    redisConfig.password = config.redis.password;
  }

  redisClient = createClient(redisConfig);

  redisClient.on('error', (err) => {
    if (redisAvailable) {
      console.error('[Redis] Redis Client Error:', err.message);
    }
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Redis Client connected.');
  });

  try {
    await redisClient.connect();
    console.log('[Redis] Redis connection has been established successfully.');
    redisAvailable = true;
  } catch (error) {
    console.warn('[Redis] Redis is not available, using in-memory fallback.');
    redisAvailable = false;
  }

  return redisClient;
};

const getRedisClient = () => {
  return redisClient;
};

const setCache = async (key, value, ttl = 3600) => {
  if (!redisAvailable || !redisClient) return;
  const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
  await redisClient.set(key, serializedValue, { EX: ttl });
};

const getCache = async (key) => {
  if (!redisAvailable || !redisClient) return null;
  const value = await redisClient.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const deleteCache = async (key) => {
  if (!redisAvailable || !redisClient) return;
  await redisClient.del(key);
};

module.exports = {
  initRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
};
