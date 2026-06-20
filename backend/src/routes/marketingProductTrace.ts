import { Router } from 'express';
import marketingProductTraceController from '../controllers/MarketingProductTraceController';

const router = Router();

router.get('/trace/:id', marketingProductTraceController.getTraceData);
router.get('/logs/:id', marketingProductTraceController.getAdmissionLogs);
router.get('/logs/marketing/:marketingId', marketingProductTraceController.getAdmissionLogsByMarketing);
router.get('/apply-info/:id', marketingProductTraceController.getApplyInfo);
router.get('/audit-info/:id', marketingProductTraceController.getAuditInfo);
router.post('/check-duplicate', marketingProductTraceController.checkDuplicateApply);
router.post('/check-cross-category', marketingProductTraceController.checkCrossCategoryViolation);
router.get('/rules', marketingProductTraceController.getAdmissionRules);

export default router;
