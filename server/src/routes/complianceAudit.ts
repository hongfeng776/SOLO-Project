import { Router } from 'express';
import * as complianceAuditController from '@controllers/ComplianceAuditController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('compliance:view'), complianceAuditController.getAuditList);
router.get('/no/:auditNo', checkPermission('compliance:view'), complianceAuditController.getAuditByNo);
router.get('/:id', checkPermission('compliance:view'), complianceAuditController.getAuditById);
router.post('/', checkPermission('compliance:manage'), complianceAuditController.createAudit);
router.put('/:id', checkPermission('compliance:manage'), complianceAuditController.updateAudit);
router.put('/:id/approve', checkPermission('compliance:manage'), complianceAuditController.approveAudit);
router.put('/:id/reject', checkPermission('compliance:manage'), complianceAuditController.rejectAudit);
router.delete('/:id', checkPermission('compliance:manage'), complianceAuditController.deleteAudit);

export default router;
