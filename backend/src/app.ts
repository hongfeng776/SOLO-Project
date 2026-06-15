import express from 'express';
import cors from 'cors';
import path from 'path';
import config from '@/config';
import db from '@/config/database';
import { notFoundHandler, errorHandler } from '@/middleware/error';
import routes from '@/routes';
import User from '@/models/User';

const PORT = config.port;
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.set('trust proxy', true);

app.use((_req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    if (config.env === 'development') {
      console.log(`[${_req.method}] ${_req.originalUrl} -> ${_res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

app.get('/', (_req, res) => {
  res.json({
    app: 'Annotation Project Backend',
    version: '1.0.0',
    env: config.env,
    docs: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/login, POST /api/auth/register, GET /api/auth/me',
      users: 'GET/POST /api/users, PUT/DELETE /api/users/:id',
      configs: 'GET/POST /api/configs, PUT/DELETE /api/configs/:id',
    },
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  try {
    await db.authenticate();
    await db.sync();

    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const bcrypt = await import('bcryptjs');
      const hashedPwd = await bcrypt.hash('admin123', config.bcryptRounds);
      await User.create({
        username: 'admin',
        password: hashedPwd,
        nickname: '超级管理员',
        email: 'admin@example.com',
        role: 'admin',
        status: 1,
      });
      console.log('[Bootstrap] Default admin created: admin / admin123');
    }

    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🧪 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`========================================\n`);
    });
  } catch (err) {
    console.error('[Bootstrap] Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

export default app;
