import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  batchExport,
  batchCalibrate,
  batchMarkQuality,
  getBatchScope,
} from '../controllers/MerchantBusinessBatchController';

const router = Router();

router.use(authMiddleware);

router.post('/export', batchExport);
router.post('/calibrate', batchCalibrate);
router.post('/markQuality', batchMarkQuality);
router.get('/scope', getBatchScope);

export default router;
