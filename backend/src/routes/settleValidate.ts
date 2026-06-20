import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  validateShopStatus,
  validateOrderFinishAge,
  validateAftersaleStatus,
  validateBankCardInfo,
  validateApplyPeriod,
  interceptDuplicate,
  validateAll,
} from '../controllers/SettleValidateController';

const router = Router();

router.use(authMiddleware);

router.get('/validate/shopStatus/:merchantId', validateShopStatus);
router.post('/validate/orderFinishAge', validateOrderFinishAge);
router.get('/validate/aftersaleStatus/:merchantId', validateAftersaleStatus);
router.get('/validate/bankCardInfo/:merchantId', validateBankCardInfo);
router.post('/validate/applyPeriod', validateApplyPeriod);
router.post('/validate/interceptDuplicate', interceptDuplicate);
router.post('/validateAll', validateAll);

export default router;
