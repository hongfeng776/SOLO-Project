import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import MarketingCalcController from '../controllers/MarketingCalcController';

const router = Router();

router.use(authMiddleware);

router.post('/calculate', MarketingCalcController.calculate);
router.post('/bestCombination', MarketingCalcController.bestCombination);
router.post('/claimCoupon', MarketingCalcController.claimCoupon);
router.post('/useCoupons', MarketingCalcController.useCoupons);
router.post('/processExpired', MarketingCalcController.processExpired);

export default router;
