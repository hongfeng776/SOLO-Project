import { Router } from 'express';
import * as operationLogController from '@controllers/OperationLogController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('log:view'), operationLogController.getLogList);
router.get('/:id', checkPermission('log:view'), operationLogController.getLogById);

export default router;
