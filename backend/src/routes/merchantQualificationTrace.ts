import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import MerchantQualificationTraceController from '../controllers/MerchantQualificationTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/merchant/:merchant_id/full', MerchantQualificationTraceController.getFullTrace);
router.get('/ledger', MerchantQualificationTraceController.getQualificationLedger);
router.post('/check/uniqueness', MerchantQualificationTraceController.checkUniqueness);
router.post('/check/fraud', MerchantQualificationTraceController.checkFraud);
router.get('/changes/:merchant_id/logs', MerchantQualificationTraceController.getMaterialChangeLogs);

export default router;
