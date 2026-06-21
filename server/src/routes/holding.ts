import { Router } from 'express';
import * as customerHoldingController from '@controllers/CustomerHoldingController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('holding:view'), customerHoldingController.getHoldingList);
router.get('/customer/:customerId', checkPermission('holding:view'), customerHoldingController.getHoldingsByCustomerId);
router.get('/:id/audit-trail', checkPermission('holding:view'), customerHoldingController.getHoldingAuditTrail);
router.post('/validate', checkPermission('holding:manage'), customerHoldingController.validateHoldingOperation);
router.post('/adjust', checkPermission('holding:manage'), customerHoldingController.adjustHolding);
router.post('/batch-lock', checkPermission('holding:manage'), customerHoldingController.batchLockHolding);
router.post('/batch-unlock', checkPermission('holding:manage'), customerHoldingController.batchUnlockHolding);
router.post('/batch-lock-by-filter', checkPermission('holding:manage'), customerHoldingController.batchLockByFilter);
router.post('/sync-market-value', checkPermission('holding:manage'), customerHoldingController.syncHoldingsMarketValue);
router.put('/:id/lock', checkPermission('holding:manage'), customerHoldingController.lockHolding);
router.put('/:id/unlock', checkPermission('holding:manage'), customerHoldingController.unlockHolding);

export default router;
