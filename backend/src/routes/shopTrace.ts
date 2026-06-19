import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getFullTrace,
  getInfoChangeLogs,
  getOperationLedgers,
  checkCompliance,
  checkUniqueness,
  checkCrossCategory,
} from '../controllers/ShopTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/merchant/:merchant_id/full', getFullTrace);
router.get('/merchant/full', getFullTrace);
router.get('/merchant/:merchant_id/infoLogs', getInfoChangeLogs);
router.get('/merchant/infoLogs', getInfoChangeLogs);
router.get('/merchant/:merchant_id/ledgers', getOperationLedgers);
router.get('/merchant/ledgers', getOperationLedgers);

router.post('/check/compliance', checkCompliance);
router.post('/check/uniqueness', checkUniqueness);
router.post('/check/crossCategory', checkCrossCategory);

export default router;
