import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { appConfig } from '@config/index';
import { errorHandler } from '@middlewares/errorHandler';
import { validationErrorHandler } from '@middlewares/validate';
import { apiLimiter } from '@middlewares/rateLimiter';
import routes from '@routes/index';
import { IApiResponse } from '@typings/index';

const app = express();

app.use(helmet());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Permissions'],
  credentials: true,
}));

app.use(compression());

if (appConfig.env !== 'test') {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(apiLimiter);

app.get('/health', (_req, res) => {
  const response: IApiResponse<{ status: string; uptime: number }> = {
    code: 200,
    message: 'OK',
    data: { status: 'healthy', uptime: process.uptime() },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

app.use('/api', routes);

app.use((_req, res) => {
  const response: IApiResponse<null> = {
    code: 404,
    message: 'Resource not found',
    data: null,
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
});

app.use(validationErrorHandler);
app.use(errorHandler);

export default app;
