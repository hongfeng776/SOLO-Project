import { Router } from 'express';
import logisticsLinkBatchController from '../controllers/LogisticsLinkBatchController';

const router = Router();

router.get('/permissions', logisticsLinkBatchController.getUserPermissions);
router.get('/query', logisticsLinkBatchController.queryShipments);
router.post('/refresh', logisticsLinkBatchController.getRefreshData);
router.post('/mark-abnormal', logisticsLinkBatchController.batchMarkAbnormal);
router.post('/launch-verify', logisticsLinkBatchController.batchLaunchVerify);
router.post('/sync-status', logisticsLinkBatchController.batchSyncStatus);

export default router;
