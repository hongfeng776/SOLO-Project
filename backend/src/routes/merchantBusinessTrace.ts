import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getFullTrace,
  checkDataAccuracy,
  getOrderDetails,
  getSettlementRecords,
  getAbnormalLogs,
} from '../controllers/MerchantBusinessTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/fullTrace/:id', getFullTrace);
router.get('/checkAccuracy/:id', checkDataAccuracy);
router.get('/orderDetails/:id', getOrderDetails);
router.get('/settlementRecords/:id', getSettlementRecords);
router.get('/abnormalLogs/:merchant_id', getAbnormalLogs);

export default router;
