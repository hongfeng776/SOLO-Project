import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getOrderTrace,
  validateOrderData,
  getOrderStatistics,
  getUserOrderHistory,
  getPaymentFlows,
  getGoodsSnapshots,
  getMerchantOrderRecords,
  getOrderLogs,
} from '../controllers/OrderTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/:id/trace', getOrderTrace);
router.get('/:id/validate', validateOrderData);
router.get('/:id/statistics', getOrderStatistics);
router.get('/user/:userId/history', getUserOrderHistory);
router.get('/:orderId/paymentFlows', getPaymentFlows);
router.get('/:orderId/goodsSnapshots', getGoodsSnapshots);
router.get('/:orderId/merchantRecords', getMerchantOrderRecords);
router.get('/:orderId/logs', getOrderLogs);

export default router;
