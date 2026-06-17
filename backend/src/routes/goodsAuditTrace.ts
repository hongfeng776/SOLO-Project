import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import GoodsAuditTraceController from '../controllers/GoodsAuditTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/trace/:id', GoodsAuditTraceController.getAuditFullTrace);
router.get('/duplicate', GoodsAuditTraceController.checkDuplicateSubmit);
router.get('/timeliness', GoodsAuditTraceController.checkAuditTimeliness);
router.get('/timeoutAlerts', GoodsAuditTraceController.getTimeoutAlerts);
router.get('/stats', GoodsAuditTraceController.getAuditStats);

export default router;
