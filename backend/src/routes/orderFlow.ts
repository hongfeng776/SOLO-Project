import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import OrderFlowController from '../controllers/OrderFlowController';

const router = Router();

router.use(authMiddleware);

router.post('/create', OrderFlowController.createOrder);
router.post('/:id/pay', OrderFlowController.payOrder);
router.post('/:id/ship', OrderFlowController.shipOrder);
router.post('/:id/receive', OrderFlowController.receiveOrder);
router.post('/:id/complete', OrderFlowController.completeOrder);
router.post('/:id/cancel', OrderFlowController.cancelOrder);
router.get('/:id/logs', OrderFlowController.getOrderLogs);
router.get('/:id/items', OrderFlowController.getOrderItems);

export default router;
