import { Router } from 'express';
import marketingDiscountRuleController from '../controllers/MarketingDiscountRuleController';

const router = Router();

router.get('/list', marketingDiscountRuleController.getRuleList);
router.get('/:id', marketingDiscountRuleController.getRuleDetail);
router.post('/validate/create', marketingDiscountRuleController.validateCreate);
router.post('/create', marketingDiscountRuleController.createRule);
router.put('/:id', marketingDiscountRuleController.updateRule);
router.post('/enable/:id', marketingDiscountRuleController.enableRule);
router.post('/disable/:id', marketingDiscountRuleController.disableRule);
router.post('/adjust/:id', marketingDiscountRuleController.adjustThreshold);
router.post('/check-stacking', marketingDiscountRuleController.checkIllegalStacking);
router.post('/calculate-optimal', marketingDiscountRuleController.calculateOptimalCombination);

export default router;
