import { Router } from 'express';
import * as quoteThresholdController from '@controllers/QuoteThresholdController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('stock:threshold:manage'), quoteThresholdController.getThresholdList);
router.get('/active', checkPermission('stock:threshold:manage'), quoteThresholdController.getActiveThresholds);
router.get('/:id', checkPermission('stock:threshold:manage'), quoteThresholdController.getThresholdById);
router.get('/:id/history', checkPermission('stock:threshold:manage'), quoteThresholdController.getThresholdHistory);
router.post('/check-range', checkPermission('stock:threshold:manage'), quoteThresholdController.checkRange);
router.post('/check-conflict', checkPermission('stock:threshold:manage'), quoteThresholdController.checkConflict);
router.post('/check-period', checkPermission('stock:threshold:manage'), quoteThresholdController.checkPeriod);
router.post('/', checkPermission('stock:threshold:manage'), quoteThresholdController.createThreshold);
router.put('/:id', checkPermission('stock:threshold:manage'), quoteThresholdController.updateThreshold);
router.post('/batch', checkPermission('stock:threshold:manage'), quoteThresholdController.batchUpdateThresholds);
router.delete('/:id', checkPermission('stock:threshold:manage'), quoteThresholdController.deleteThreshold);
router.post('/expire-temporary', checkPermission('stock:threshold:manage'), quoteThresholdController.expireTemporaryThresholds);
router.post('/match-scenarios', checkPermission('stock:threshold:manage'), quoteThresholdController.matchScenarios);

export default router;
