import { Router } from 'express';
import logisticsProviderTraceController from '../controllers/LogisticsProviderTraceController';

const router = Router();

router.get('/full/:id', logisticsProviderTraceController.getFullTrace);
router.get('/summary/:id', logisticsProviderTraceController.getTraceSummary);
router.get('/qualifications/:id', logisticsProviderTraceController.getQualificationList);
router.get('/contracts/:id', logisticsProviderTraceController.getContractList);
router.get('/fee-changes/:id', logisticsProviderTraceController.getFeeChangeLogs);
router.get('/evaluations/:id', logisticsProviderTraceController.getEvaluationList);
router.get('/operation-logs/:id', logisticsProviderTraceController.getOperationLogs);

export default router;
