import { Router } from 'express';
import marketingDiscountRuleTraceController from '../controllers/MarketingDiscountRuleTraceController';

const router = Router();

router.get('/:id', marketingDiscountRuleTraceController.getTraceData);
router.get('/logs/:id', marketingDiscountRuleTraceController.getConfigLogs);
router.get('/usage/:id', marketingDiscountRuleTraceController.getUsageRecords);
router.get('/conflicts/:id', marketingDiscountRuleTraceController.getStackConflicts);
router.get('/budget/:id', marketingDiscountRuleTraceController.getBudgetLedger);
router.post('/check-stacking', marketingDiscountRuleTraceController.checkIllegalStacking);
router.get('/check-overlimit', marketingDiscountRuleTraceController.checkOverLimit);
router.get('/marketing-budget/:marketingId', marketingDiscountRuleTraceController.getMarketingBudgetLedger);

export default router;
