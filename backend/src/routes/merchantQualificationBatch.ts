import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import MerchantQualificationBatchController from '../controllers/MerchantQualificationBatchController';

const router = Router();

router.use(authMiddleware);

router.post('/review', MerchantQualificationBatchController.batchReview);
router.post('/remind', MerchantQualificationBatchController.batchRemind);
router.post('/freeze', MerchantQualificationBatchController.batchFreeze);
router.post('/approve', MerchantQualificationBatchController.batchApprove);
router.post('/reject', MerchantQualificationBatchController.batchReject);
router.get('/scope', MerchantQualificationBatchController.getBatchScope);

export default router;
