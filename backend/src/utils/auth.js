﻿const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { setCache, getCache, deleteCache } = require('../config/redis');

const memoryStore = new Map();

const generateAccessToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
};

const generateTokens = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const saveTokenToRedis = async (userId, accessToken, refreshToken) => {
  const accessTtl = jwt.decode(accessToken).exp - Math.floor(Date.now() / 1000);
  const refreshTtl = jwt.decode(refreshToken).exp - Math.floor(Date.now() / 1000);
  try {
    await setCache('token:access:' + userId, accessToken, accessTtl);
    await setCache('token:refresh:' + userId, refreshToken, refreshTtl);
  } catch {
    memoryStore.set('token:access:' + userId, accessToken);
    memoryStore.set('token:refresh:' + userId, refreshToken);
  }
};

const removeTokenFromRedis = async (userId) => {
  try {
    await deleteCache('token:access:' + userId);
    await deleteCache('token:refresh:' + userId);
  } catch {
  }
  memoryStore.delete('token:access:' + userId);
  memoryStore.delete('token:refresh:' + userId);
};

const getStoredToken = async (userId, type = 'access') => {
  try {
    const cached = await getCache('token:' + type + ':' + userId);
    if (cached) return cached;
  } catch {
  }
  return memoryStore.get('token:' + type + ':' + userId) || null;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  hashPassword,
  comparePassword,
  saveTokenToRedis,
  removeTokenFromRedis,
  getStoredToken,
};
