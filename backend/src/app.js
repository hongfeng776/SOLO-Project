require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { recordOperation } = require('./middleware/operationLog');
const { testConnection, syncDatabase } = require('./config/database');
const { initRedis } = require('./config/redis');
const routes = require('./routes');
const schedulerService = require('./services/SchedulerService');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
}));

app.use(compression());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(config.apiPrefix, limiter);

app.use(recordOperation);

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('========================================');
    console.log('  奇影内容运营管理平台 - 后端服务');
    console.log('========================================\n');

    await testConnection();
    await syncDatabase(false);
    await initRedis();

    app.listen(config.port, () => {
      console.log(`\n[Server] Server is running on http://localhost:${config.port}`);
      console.log(`[Server] API Base URL: http://localhost:${config.port}${config.apiPrefix}`);
      console.log(`[Server] Environment: ${config.env}`);
      console.log('\n========================================\n');

      schedulerService.start();
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
