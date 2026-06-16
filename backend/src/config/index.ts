import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

dotenv.config({
  path: path.resolve(process.cwd(), envFile)
});

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'ccb_admin',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  logLevel: process.env.LOG_LEVEL || 'info'
};