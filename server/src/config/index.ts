import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  apiPrefix: '/api/v1',
};

export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  name: process.env.DB_NAME || 'zhitou_finance',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  dialect: process.env.DB_DIALECT || 'mysql',
};

export const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: Number(process.env.REDIS_DB) || 0,
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'zhitou_finance_jwt_secret_key_2024',
  expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

export const rateLimitConfig = {
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
};
