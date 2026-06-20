import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  calcAmount,
  changeStatus,
  createApply,
  batchCalc,
} from '../controllers/SettleCalcController';

const router = Router();

router.use(authMiddleware);

router.post('/calcAmount', calcAmount);
router.put('/changeStatus', changeStatus);
router.post('/createApply', createApply);
router.post('/batchCalc', batchCalc);

export default router;
