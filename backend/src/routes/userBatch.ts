import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import userBatchController from '../controllers/UserBatchController';

const router = Router();

router.use(authMiddleware);

router.post('/batch-update-tags', userBatchController.batchUpdateTags);
router.post('/batch-freeze', userBatchController.batchFreeze);
router.post('/batch-unfreeze', userBatchController.batchUnfreeze);
router.post('/batch-reset-permissions', userBatchController.batchResetPermissions);
router.post('/batch-update-status', userBatchController.batchUpdateStatus);

export default router;
