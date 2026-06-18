import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getPaymentList,
  getFilteredIds,
  batchVerifyPayment,
  batchResetExpireTime,
  batchMarkReconcile,
  batchHandleRisk,
  checkFinancePermission,
} from '../controllers/PaymentBatchController';

const router = Router();

router.use(authMiddleware);

router.get('/list', getPaymentList);
router.post('/filtered-ids', getFilteredIds);
router.post('/batch-verify', batchVerifyPayment);
router.post('/batch-reset-expire', batchResetExpireTime);
router.post('/batch-mark-reconcile', batchMarkReconcile);
router.post('/batch-handle-risk', batchHandleRisk);
router.get('/check-finance-permission', checkFinancePermission);

export default router;
