import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import OperateLogController from '../controllers/OperateLogController';

const router = Router();

router.use(authMiddleware);

router.get('/list', OperateLogController.getLogList);
router.get('/stats', OperateLogController.getLogStats);
router.get('/traceUser', OperateLogController.traceUserOperations);
router.get('/traceIp', OperateLogController.traceByIp);
router.get('/errors', OperateLogController.getErrorLogs);
router.get('/export', OperateLogController.exportLogs);

export default router;
