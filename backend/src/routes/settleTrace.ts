import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  fullTrace,
  checkConsistency,
  interceptDuplicate,
  interceptOverSettle,
} from '../controllers/SettleTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/fullTrace/:applyId', fullTrace);
router.get('/checkConsistency/:applyId', checkConsistency);
router.post('/interceptDuplicate', interceptDuplicate);
router.post('/interceptOverSettle', interceptOverSettle);

export default router;
