import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getDashboard,
  getSalesStats,
  getGoodsStats,
  getUserStats,
  getOrderStats,
  getMarketingStats,
  getAfterSaleStats,
  getMerchantStats,
  getHotGoods,
  getActiveOrders,
  getCoreUsers,
} from '../controllers/StatisticsController';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboard);
router.get('/sales', getSalesStats);
router.get('/goods', getGoodsStats);
router.get('/users', getUserStats);
router.get('/orders', getOrderStats);
router.get('/marketing', getMarketingStats);
router.get('/aftersale', getAfterSaleStats);
router.get('/merchant', getMerchantStats);
router.get('/hotGoods', getHotGoods);
router.get('/activeOrders', getActiveOrders);
router.get('/coreUsers', getCoreUsers);

export default router;
