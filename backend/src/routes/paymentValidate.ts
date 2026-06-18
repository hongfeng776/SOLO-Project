import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  verifyPayment,
  validateAmount,
  validateChannel,
  validateTimeliness,
  validateUserAccount,
  syncPaymentStatus,
  closeExpiredChannels,
  createPaymentFlow,
  getPaymentFlow,
} from '../controllers/PaymentValidateController';

const router = Router();

router.use(authMiddleware);

router.post('/verify', verifyPayment);
router.post('/validate/amount', validateAmount);
router.post('/validate/channel', validateChannel);
router.get('/validate/timeliness/:orderId', validateTimeliness);
router.get('/validate/user/:userId', validateUserAccount);
router.put('/sync/:flowId', syncPaymentStatus);
router.post('/close-expired', closeExpiredChannels);
router.post('/flow', createPaymentFlow);
router.get('/flow/:id', getPaymentFlow);

export default router;
