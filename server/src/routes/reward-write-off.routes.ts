import { Router } from 'express';
import { rewardWriteOffController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', rewardWriteOffController.getWriteOffList);
router.get('/stats', rewardWriteOffController.getStats);
router.get('/report', rewardWriteOffController.generateReport);
router.post('/', rewardWriteOffController.createWriteOff);
router.post('/batch-verify', rewardWriteOffController.batchVerify);
router.post('/batch-settle', rewardWriteOffController.settleWriteOffBatch);
router.post('/batch-cancel', rewardWriteOffController.batchCancel);
router.post('/batch-override', rewardWriteOffController.batchOverride);
router.get('/:id', rewardWriteOffController.getWriteOffDetail);
router.post('/:id/verify', rewardWriteOffController.verifyWriteOff);
router.post('/:id/settle', rewardWriteOffController.settleWriteOff);
router.get('/:id/logs', rewardWriteOffController.getWriteOffLogs);
router.post('/:id/check-compliance', rewardWriteOffController.checkCompliance);
router.post('/:id/block', rewardWriteOffController.blockNonCompliant);

export default router;
