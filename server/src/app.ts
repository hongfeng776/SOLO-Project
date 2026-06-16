import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { auditLog } from './middleware/audit.middleware';
import Logger from './utils/logger';

const createApp = (): Application => {
  const app: Application = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use((req: Request, _res: Response, next: NextFunction) => {
    Logger.info(`${req.method} ${req.path}`);
    next();
  });

  app.use(auditLog);

  app.use('/api', routes);

  app.use(notFoundMiddleware);

  app.use(errorMiddleware);

  return app;
};

export default createApp;
