import { Router } from 'express';
import * as tradeController from '@controllers/TradeController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('trade:view'), tradeController.getTradeList);
router.get('/:id', checkPermission('trade:view'), tradeController.getTradeById);
router.get('/no/:tradeNo', checkPermission('trade:view'), tradeController.getTradeByNo);
router.post('/', checkPermission('trade:manage'), tradeController.createTrade);
router.put('/:id/audit', checkPermission('trade:manage'), tradeController.auditTrade);
router.put('/:id/cancel', checkPermission('trade:manage'), tradeController.cancelTrade);

export default router;
