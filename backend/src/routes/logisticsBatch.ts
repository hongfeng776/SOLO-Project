import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getShipmentList,
  getFilteredIds,
  batchShip,
  batchUpdateAbnormal,
  batchResendNotification,
  batchImport,
} from '../controllers/LogisticsBatchController';

const router = Router();

router.use(authMiddleware);

router.get('/list', getShipmentList);
router.post('/filtered-ids', getFilteredIds);
router.post('/batch-ship', batchShip);
router.post('/batch-abnormal', batchUpdateAbnormal);
router.post('/batch-resend', batchResendNotification);
router.post('/batch-import', batchImport);

export default router;
