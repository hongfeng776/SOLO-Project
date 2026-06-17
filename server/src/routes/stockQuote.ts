import { Router } from 'express';
import * as stockQuoteController from '@controllers/StockQuoteController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/validate-code', checkPermission('stock:view'), stockQuoteController.validateStockCode);
router.get('/trading-session', checkPermission('stock:view'), stockQuoteController.checkTradingSession);
router.get('/data-source-status', checkPermission('stock:view'), stockQuoteController.checkDataSourceStatus);
router.get('/template', checkPermission('stock:manage'), stockQuoteController.exportTemplate);
router.post('/import', checkPermission('stock:manage'), stockQuoteController.batchImportQuotes);
router.get('/import/progress/:taskId', checkPermission('stock:manage'), stockQuoteController.getImportProgress);
router.get('/check-registered', checkPermission('stock:manage'), stockQuoteController.checkRegistered);
router.get('/:id/check-fluctuation', checkPermission('stock:manage'), stockQuoteController.checkFluctuation);
router.post('/validate-record', checkPermission('stock:manage'), stockQuoteController.validateRecord);
router.get('/:id/audit-trail', checkPermission('stock:view'), stockQuoteController.getAuditTrail);
router.get('/:id/consistency', checkPermission('stock:view'), stockQuoteController.checkConsistency);
router.post('/create-with-audit', checkPermission('stock:manage'), stockQuoteController.createWithAudit);
router.get('/', checkPermission('stock:view'), stockQuoteController.getStockList);
router.get('/code/:stockCode', checkPermission('stock:view'), stockQuoteController.getStockByCode);
router.get('/:id/history', checkPermission('stock:view'), stockQuoteController.getStockHistory);
router.get('/:id', checkPermission('stock:view'), stockQuoteController.getStockById);
router.post('/refresh-prices', checkPermission('stock:manage'), stockQuoteController.refreshAllPrices);
router.post('/validate', checkPermission('stock:manage'), stockQuoteController.validateQuoteData);
router.post('/batch-delete', checkPermission('stock:manage'), stockQuoteController.batchDeleteStock);
router.post('/', checkPermission('stock:manage'), stockQuoteController.createStock);
router.put('/:id', checkPermission('stock:manage'), stockQuoteController.updateStock);
router.delete('/:id', checkPermission('stock:manage'), stockQuoteController.deleteStock);

export default router;
