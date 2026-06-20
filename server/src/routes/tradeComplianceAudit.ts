import { Router } from 'express';
import * as tradeComplianceAuditController from '@controllers/TradeComplianceAuditController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', checkPermission('compliance:view'), tradeComplianceAuditController.getStats);
router.get('/', checkPermission('compliance:view'), tradeComplianceAuditController.getAuditList);
router.post('/', checkPermission('compliance:manage'), tradeComplianceAuditController.createAudit);
router.post('/batch-preview', checkPermission('compliance:audit:batch'), tradeComplianceAuditController.batchPreview);
router.post('/batch-audit', checkPermission('compliance:audit:batch'), tradeComplianceAuditController.batchAudit);
router.post('/mark-timeout', checkPermission('compliance:manage'), tradeComplianceAuditController.markTimeout);
router.get('/:id', checkPermission('compliance:view'), tradeComplianceAuditController.getAuditById);
router.get('/:id/logs', checkPermission('compliance:view'), tradeComplianceAuditController.getAuditLogs);
router.post('/:id/pre-check', checkPermission('compliance:audit:approve'), tradeComplianceAuditController.preCheck);
router.put('/:id/approve', checkPermission('compliance:audit:approve'), tradeComplianceAuditController.approveAudit);
router.put('/:id/reject', checkPermission('compliance:audit:reject'), tradeComplianceAuditController.rejectAudit);

export default router;
