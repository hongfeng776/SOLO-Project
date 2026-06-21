import { Router } from 'express';
import logisticsProviderBatchController from '../controllers/LogisticsProviderBatchController';

const router = Router();

router.post('/filtered-ids', logisticsProviderBatchController.getFilteredIds);
router.post('/batch-enable', logisticsProviderBatchController.batchEnable);
router.post('/batch-disable', logisticsProviderBatchController.batchDisable);
router.post('/batch-update-fees', logisticsProviderBatchController.batchUpdateFees);
router.post('/batch-adjust-priority', logisticsProviderBatchController.batchAdjustPriority);
router.post('/batch-update-level', logisticsProviderBatchController.batchUpdateLevel);
router.post('/refresh-list', logisticsProviderBatchController.getRefreshListData);

export default router;
