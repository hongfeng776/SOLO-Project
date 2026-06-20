import { Router } from 'express';
import marketingTraceController from '../controllers/MarketingTraceController';

const router = Router();

router.get('/trace/:id', marketingTraceController.getTraceData);
router.get('/trace/:id/logs', marketingTraceController.getOperationLogs);
router.get('/trace/:id/products', marketingTraceController.getProductLedger);
router.get('/trace/:id/create-info', marketingTraceController.getCreateInfo);
router.post('/trace/check-duplicate', marketingTraceController.checkDuplicateConfig);

export default router;
