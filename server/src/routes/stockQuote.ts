import { Router } from 'express';
import * as stockQuoteController from '@controllers/StockQuoteController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('stock:view'), stockQuoteController.getStockList);
router.get('/code/:stockCode', checkPermission('stock:view'), stockQuoteController.getStockByCode);
router.get('/:id', checkPermission('stock:view'), stockQuoteController.getStockById);
router.post('/', checkPermission('stock:manage'), stockQuoteController.createStock);
router.put('/:id', checkPermission('stock:manage'), stockQuoteController.updateStock);
router.delete('/:id', checkPermission('stock:manage'), stockQuoteController.deleteStock);

export default router;
