import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import roleRoutes from './role';
import permissionRoutes from './permission';
import orgRoutes from './org';
import businessRoutes from './business';
import auditRoutes from './audit';
import logRoutes from './log';
import dashboardRoutes from './dashboard';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, '服务运行正常');
});

router.get('/health/check', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    service: 'ccb-admin-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }, '健康检查通过');
});

router.use('/auth', authRoutes);
router.use('/system/user', userRoutes);
router.use('/system/role', roleRoutes);
router.use('/system/permission', permissionRoutes);
router.use('/system/org', orgRoutes);
router.use('/business', businessRoutes);
router.use('/audit', auditRoutes);
router.use('/system/log', logRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
