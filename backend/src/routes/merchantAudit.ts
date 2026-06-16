import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import MerchantAuditController from '../controllers/MerchantAuditController';

const router = Router();

router.use(authMiddleware);

router.post('/submit', MerchantAuditController.submitAudit);
router.post('/:id/approve', MerchantAuditController.approveAudit);
router.post('/:id/reject', MerchantAuditController.rejectAudit);
router.post('/batchApprove', MerchantAuditController.batchApprove);
router.post('/batchReject', MerchantAuditController.batchReject);
router.get('/list', MerchantAuditController.getAuditList);

export default router;
