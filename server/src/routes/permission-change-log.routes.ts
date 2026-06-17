import { Router } from 'express';
import permissionChangeLogController from '../controllers/PermissionChangeLog.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', permissionChangeLogController.findAll);
router.get('/anomalies', permissionChangeLogController.detectAnomalies);
router.get('/:id', permissionChangeLogController.getDetail);
router.post('/export', permissionChangeLogController.exportLogs);
export default router;
