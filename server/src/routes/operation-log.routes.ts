import { Router } from 'express';
import operationLogController from '../controllers/OperationLog.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', operationLogController.findAll);
export default router;
