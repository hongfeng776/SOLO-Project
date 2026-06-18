import { Router } from 'express';
import * as tradeController from '@controllers/TradeController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('trade:view'), tradeController.getTradeList);
router.get('/pending', checkPermission('trade:view'), tradeController.getPendingOrders);
router.get('/trading-session', checkPermission('trade:view'), tradeController.getTradingSession);
router.get('/matching', checkPermission('trade:view'), tradeController.getMatchingOrders);
router.get('/matching-progress', checkPermission('trade:view'), tradeController.getMatchingProgress);
router.get('/no/:tradeNo', checkPermission('trade:view'), tradeController.getTradeByNo);
router.get('/:id', checkPermission('trade:view'), tradeController.getTradeById);
router.get('/:id/trace', checkPermission('trade:view'), tradeController.getOrderTrace);
router.get('/:id/matching-trace', checkPermission('trade:view'), tradeController.getMatchingTrace);
router.get('/:id/matching-validate', checkPermission('trade:view'), tradeController.validateMatchingOrder);
router.get('/:id/status-validate', checkPermission('trade:manage'), tradeController.validateStatusOperation);
router.get('/:id/status-trace', checkPermission('trade:view'), tradeController.getStatusTrace);
router.post('/', checkPermission('trade:manage'), tradeController.createTrade);
router.post('/validate', checkPermission('trade:manage'), tradeController.validateOrder);
router.post('/submit', checkPermission('trade:manage'), tradeController.submitOrder);
router.post('/batch-submit', checkPermission('trade:batch'), tradeController.batchSubmitOrders);
router.post('/batch-process', checkPermission('trade:audit'), tradeController.processBatchOrders);
router.post('/matching/:id/execute', checkPermission('trade:audit'), tradeController.executeMatching);
router.post('/matching/batch-execute', checkPermission('trade:audit'), tradeController.batchExecuteMatching);
router.post('/matching/batch-control', checkPermission('trade:audit'), tradeController.batchControlOrders);
router.put('/:id/status', checkPermission('trade:manage'), tradeController.manualChangeStatus);
router.put('/batch-status', checkPermission('trade:manage'), tradeController.batchChangeStatus);
router.put('/:id/audit', checkPermission('trade:manage'), tradeController.auditTrade);
router.put('/:id/cancel', checkPermission('trade:manage'), tradeController.cancelTrade);

export default router;
