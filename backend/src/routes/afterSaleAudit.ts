import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import AfterSaleAuditController from '../controllers/AfterSaleAuditController';

const router = Router();

router.use(authMiddleware);

router.post('/:id/audit', AfterSaleAuditController.audit);
router.post('/batchAudit', AfterSaleAuditController.batchAudit);
router.post('/:id/executeRefund', AfterSaleAuditController.executeRefund);
router.get('/:id/audits', AfterSaleAuditController.getAudits);

export default router;
