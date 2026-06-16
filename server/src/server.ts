import app from './app';
import { appConfig } from '@config/index';
import { sequelize } from '@config/database';
import { getRedisClient, disconnectRedis } from '@config/redis';
import { Server } from 'http';

let server: Server;

async function bootstrap() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    console.log('Syncing database...');
    await sequelize.sync({ alter: appConfig.env === 'development' });
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }

  try {
    console.log('Testing Redis connection...');
    await getRedisClient();
    console.log('Redis connection has been established successfully.');
  } catch (error) {
    console.warn('Warning: Failed to connect to Redis, running in degraded mode:', error);
  }

  server = app.listen(appConfig.port, () => {
    console.log(`Server is running on port ${appConfig.port}`);
    console.log(`Environment: ${appConfig.env}`);
  });
}

async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, starting graceful shutdown...`);

  server.close(() => {
    console.log('HTTP server closed.');
  });

  try {
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }

  try {
    await disconnectRedis();
    console.log('Redis connection closed.');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }

  console.log('Graceful shutdown completed.');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

bootstrap();
