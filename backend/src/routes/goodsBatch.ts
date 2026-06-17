import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import goodsBatchController from '../controllers/GoodsBatchController';

const router = Router();

router.use(authMiddleware);

router.get('/advanced-query', goodsBatchController.advancedQuery);
router.post('/batch-offline', goodsBatchController.batchOffline);
router.post('/batch-top', goodsBatchController.batchTop);
router.post('/batch-update', goodsBatchController.batchUpdate);
router.post('/batch-ability', goodsBatchController.getBatchAbility);

export default router;
