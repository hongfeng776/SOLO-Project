import { Router } from 'express';
import marketingDiscountRuleBatchController from '../controllers/MarketingDiscountRuleBatchController';

const router = Router();

router.post('/enable', marketingDiscountRuleBatchController.batchEnable);
router.post('/disable', marketingDiscountRuleBatchController.batchDisable);
router.post('/adjust-threshold', marketingDiscountRuleBatchController.batchAdjustThreshold);
router.post('/clear-quota', marketingDiscountRuleBatchController.batchClearExpiredQuota);
router.post('/filter-operate', marketingDiscountRuleBatchController.batchFilterOperate);

export default router;
