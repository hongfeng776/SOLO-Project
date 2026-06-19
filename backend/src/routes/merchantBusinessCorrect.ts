import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  correctBusinessData,
  recalcLevelAndRank,
  getCorrectLogs,
  validateCorrectDiff,
} from '../controllers/MerchantBusinessCorrectController';

const router = Router();

router.use(authMiddleware);

router.post('/correct/:id', correctBusinessData);
router.post('/recalcLevel', recalcLevelAndRank);
router.get('/correctLogs/:merchant_id', getCorrectLogs);
router.post('/validate/diff', validateCorrectDiff);

export default router;
