import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { config } from './config';
import { sequelize, testConnection } from './config/database';
import { authMiddleware, errorHandler, notFoundHandler, loggerMiddleware } from './middlewares';
import routes from './routes';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(loggerMiddleware);
app.use(authMiddleware);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app, sequelize, testConnection };
export default app;