import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  verifyShipping,
  validatePayment,
  validateStock,
  validateProvider,
  validateAddress,
  validateLogisticsNo,
  checkDuplicateNo,
  shipOrder,
  updateLogisticsStatus,
  getProviderList,
} from '../controllers/ShippingValidateController';

const router = Router();

router.use(authMiddleware);

router.post('/verify', verifyShipping);
router.get('/validate/payment/:orderId', validatePayment);
router.get('/validate/stock/:orderId', validateStock);
router.get('/validate/provider/:providerId', validateProvider);
router.post('/validate/address', validateAddress);
router.post('/validate/logistics-no', validateLogisticsNo);
router.post('/check-duplicate', checkDuplicateNo);
router.post('/ship', shipOrder);
router.put('/status', updateLogisticsStatus);
router.get('/providers', getProviderList);

export default router;
