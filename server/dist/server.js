"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const database_1 = require("./config/database");
const redis_1 = __importDefault(require("./config/redis"));
const models_1 = require("./models");
const logger_1 = __importDefault(require("./utils/logger"));
const startServer = async () => {
    try {
        (0, models_1.associate)();
        await database_1.sequelize.authenticate();
        logger_1.default.info('Database connection established successfully');
        await database_1.sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        logger_1.default.info('Database models synchronized');
        const app = (0, app_1.default)();
        const server = app.listen(config_1.default.port, () => {
            logger_1.default.info(`Server is running on port ${config_1.default.port}`);
            logger_1.default.info(`Environment: ${config_1.default.nodeEnv}`);
            logger_1.default.info(`Health check: http://localhost:${config_1.default.port}/api/health`);
        });
        const gracefulShutdown = async (signal) => {
            logger_1.default.info(`${signal} received. Starting graceful shutdown...`);
            server.close(() => {
                logger_1.default.info('HTTP server closed');
            });
            try {
                await database_1.sequelize.close();
                logger_1.default.info('Database connection closed');
            }
            catch (error) {
                logger_1.default.error('Error closing database connection:', error);
            }
            try {
                await redis_1.default.quit();
                logger_1.default.info('Redis connection closed');
            }
            catch (error) {
                logger_1.default.error('Error closing Redis connection:', error);
            }
            process.exit(0);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map