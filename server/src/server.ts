import createApp from './app';
import config from './config';
import { sequelize } from './config/database';
import redis from './config/redis';
import { associate } from './models';
import Logger from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    associate();

    await sequelize.authenticate();
    Logger.info('Database connection established successfully');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    Logger.info('Database models synchronized');

    const app = createApp();

    const server = app.listen(config.port, () => {
      Logger.info(`Server is running on port ${config.port}`);
      Logger.info(`Environment: ${config.nodeEnv}`);
      Logger.info(`Health check: http://localhost:${config.port}/api/health`);
    });

    const gracefulShutdown = async (signal: string): Promise<void> => {
      Logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        Logger.info('HTTP server closed');
      });

      try {
        await sequelize.close();
        Logger.info('Database connection closed');
      } catch (error) {
        Logger.error('Error closing database connection:', error);
      }

      try {
        await redis.quit();
        Logger.info('Redis connection closed');
      } catch (error) {
        Logger.error('Error closing Redis connection:', error);
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
