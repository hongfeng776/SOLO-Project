import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  validateShopName,
  validateCustomerServicePhone,
  validateShopCategory,
  detectSensitiveWords,
  checkDuplicate,
  validateAll,
  getShopInfo,
  getShopList,
  updateShopInfo,
} from '../controllers/ShopInfoController';

const router = Router();

router.use(authMiddleware);

router.post('/validate/shopName', validateShopName);
router.post('/validate/phone', validateCustomerServicePhone);
router.post('/validate/category', validateShopCategory);
router.post('/validate/sensitiveWords', detectSensitiveWords);
router.post('/validate/duplicate', checkDuplicate);
router.post('/validate/all', validateAll);

router.post('/update', updateShopInfo);

router.get('/list', getShopList);
router.get('/merchant/:merchant_id', getShopInfo);
router.get('/merchant', getShopInfo);

export default router;
