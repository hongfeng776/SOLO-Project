import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createOrderWithValidation,
  validateOrderBeforeCreate,
  validatePaymentStatus,
  validateStock,
  validateMerchantPermission,
  validateLogisticsArea,
  validateDuplicateOrder,
  validateAmount,
  getExceptionList,
  handleException,
} from '../controllers/OrderValidateController';

const router = Router();

router.use(authMiddleware);

router.post('/create', createOrderWithValidation);
router.post('/preValidate', validateOrderBeforeCreate);
router.get('/paymentStatus/:userId', validatePaymentStatus);
router.post('/stock', validateStock);
router.get('/merchantPermission/:merchantId', validateMerchantPermission);
router.post('/logisticsArea', validateLogisticsArea);
router.get('/duplicate/:orderNo', validateDuplicateOrder);
router.post('/amount', validateAmount);
router.get('/exceptions', getExceptionList);
router.put('/exception/:id/handle', handleException);

export default router;
