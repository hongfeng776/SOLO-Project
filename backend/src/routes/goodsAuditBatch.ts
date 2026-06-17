import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import GoodsAuditBatchController from '../controllers/GoodsAuditBatchController';

const router = Router();

router.use(authMiddleware);

router.get('/filter', GoodsAuditBatchController.batchFilter);
router.post('/approve', GoodsAuditBatchController.batchApprove);
router.post('/reject', GoodsAuditBatchController.batchReject);
router.post('/supplement', GoodsAuditBatchController.batchRequestSupplement);
router.get('/scope', GoodsAuditBatchController.getBatchScope);
router.post('/abilityMap', GoodsAuditBatchController.getAbilityMap);

export default router;
