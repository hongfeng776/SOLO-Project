import { Router } from 'express';
import * as tradeController from '@controllers/TradeController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('trade:view'), tradeController.getTradeList);
router.get('/pending', checkPermission('trade:view'), tradeController.getPendingOrders);
router.get('/trading-session', checkPermission('trade:view'), tradeController.getTradingSession);
router.get('/:id', checkPermission('trade:view'), tradeController.getTradeById);
router.get('/:id/trace', checkPermission('trade:view'), tradeController.getOrderTrace);
router.get('/no/:tradeNo', checkPermission('trade:view'), tradeController.getTradeByNo);
router.post('/', checkPermission('trade:manage'), tradeController.createTrade);
router.post('/validate', checkPermission('trade:manage'), tradeController.validateOrder);
router.post('/submit', checkPermission('trade:manage'), tradeController.submitOrder);
router.post('/batch-submit', checkPermission('trade:batch'), tradeController.batchSubmitOrders);
router.post('/batch-process', checkPermission('trade:audit'), tradeController.processBatchOrders);
router.put('/:id/audit', checkPermission('trade:manage'), tradeController.auditTrade);
router.put('/:id/cancel', checkPermission('trade:manage'), tradeController.cancelTrade);

export default router;
