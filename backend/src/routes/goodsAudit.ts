import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import GoodsAuditController from '../controllers/GoodsAuditController';

const router = Router();

router.use(authMiddleware);

router.post('/submit', GoodsAuditController.submitAudit);
router.post('/:id/approve', GoodsAuditController.approveAudit);
router.post('/:id/reject', GoodsAuditController.rejectAudit);
router.post('/batchApprove', GoodsAuditController.batchApprove);
router.post('/batchReject', GoodsAuditController.batchReject);
router.get('/list', GoodsAuditController.getAuditList);

export default router;
