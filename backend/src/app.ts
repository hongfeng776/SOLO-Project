import 'reflect-metadata';
import express, { Request, Response, Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger, loggerMiddleware } from './middlewares/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { appConfig } from './config/index';
import { ok } from './utils/response';
import { Router } from 'express';
import { connectDatabase } from './config/database';
import redis from './config/redis';
import routes from './routes';

const app: Express = express();

app.use(helmet());

app.use(cors({
  origin: appConfig.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(loggerMiddleware);
app.use(requestLogger);

app.get('/health', (_req: Request, res: Response) => {
  ok(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: appConfig.env,
  }, 'Server is running');
});

const apiRouter = Router();

apiRouter.get('/', (_req: Request, res: Response) => {
  ok(res, {
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      auth: '/api/v1/auth',
    },
  }, 'Welcome to Annotation Project API');
});

apiRouter.use(routes);

app.use('/api/v1', apiRouter);

app.use('*', notFoundHandler);

app.use(errorHandler);

const PORT = appConfig.port;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await redis.ping();

    const server = app.listen(PORT, () => {
      console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 Annotation Project Backend Server                    ║
  ║                                                           ║
  ║   Environment: ${appConfig.env.padEnd(43)}║
  ║   Port:        ${String(PORT).padEnd(43)}║
  ║   Health:      http://localhost:${String(PORT).padEnd(28)}/health ║
  ║   API:         http://localhost:${String(PORT).padEnd(28)}/api/v1 ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
      `);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, closing server...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, closing server...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
