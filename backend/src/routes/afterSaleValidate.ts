import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  applyAfterSale,
  verifyApply,
  verifyTerminate,
  cancelOrder,
  processAfterSale,
  validateDeadline,
  validateCredit,
} from '../controllers/AfterSaleValidateController';

const router = Router();

router.use(authMiddleware);

router.post('/apply', applyAfterSale);
router.post('/verify', verifyApply);
router.post('/verify-terminate', verifyTerminate);
router.post('/cancel', cancelOrder);
router.put('/process', processAfterSale);
router.get('/validate/deadline/:orderId', validateDeadline);
router.get('/validate/credit/:userId', validateCredit);

export default router;
