import { Router } from 'express';
import marketingBatchController from '../controllers/MarketingBatchController';

const router = Router();

router.post('/batch/online', marketingBatchController.batchOnline);
router.post('/batch/offline', marketingBatchController.batchOffline);
router.post('/batch/pause', marketingBatchController.batchPause);
router.post('/batch/filter-operate', marketingBatchController.filterAndOperate);
router.post('/batch/offline-expired', marketingBatchController.batchOfflineExpired);
router.post('/batch/online-pending', marketingBatchController.batchOnlinePending);

export default router;
