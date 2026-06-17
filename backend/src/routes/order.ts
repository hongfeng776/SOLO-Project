import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getOrderList,
  getOrderDetail,
  getOrderDetailWithItems,
  createOrder,
  updateOrder,
  updateOrderStatus,
  shipOrder,
  completeOrder,
  cancelOrder,
  deleteOrder,
  batchDeleteOrders,
} from '../controllers/OrderController';

const router = Router();

router.use(authMiddleware);

router.get('/list', getOrderList);
router.get('/:id', getOrderDetail);
router.get('/:id/items', getOrderDetailWithItems);
router.post('/create', createOrder);
router.put('/:id', updateOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/ship', shipOrder);
router.put('/:id/complete', completeOrder);
router.put('/:id/cancel', cancelOrder);
router.delete('/:id', deleteOrder);
router.post('/batchDelete', batchDeleteOrders);

export default router;
