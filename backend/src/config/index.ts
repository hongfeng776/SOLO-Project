import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'annotation_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    poolMin: parseInt(process.env.DB_POOL_MIN || '0', 10),
    poolIdle: parseInt(process.env.DB_POOL_IDLE || '30000', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'annotation-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
};

export default config;
