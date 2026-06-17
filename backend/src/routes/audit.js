const express = require('express');
const AuditController = require('../controllers/AuditController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/contents/:contentId/detail', authenticate, requirePermission('content:audit'), AuditController.getAuditDetail);
router.get('/contents/:contentId/preview-assign', authenticate, requirePermission('content:audit'), AuditController.previewAssign);
router.get('/contents/:contentId/check-duplicate', authenticate, requirePermission('content:audit'), AuditController.checkDuplicate);
router.post('/validate-operation', authenticate, requirePermission('content:audit'), AuditController.validateOperation);
router.post('/submit', authenticate, requirePermission('content:audit'), AuditController.submitAudit);
router.post('/batch-action', authenticate, requirePermission('content:audit'), AuditController.batchAction);
router.get('/task-pool', authenticate, requirePermission('content:audit'), AuditController.getTaskPool);
router.get('/trace', authenticate, requirePermission('content:audit'), AuditController.getAuditTrace);
router.get('/quality-report', authenticate, requirePermission('audit:qc'), AuditController.getQualityReport);
router.get('/assign-rules', authenticate, requirePermission('content:audit'), AuditController.getAssignRules);
router.get('/reject-reasons', authenticate, requirePermission('content:audit'), AuditController.getRejectReasons);
router.post('/refresh-partial', authenticate, requirePermission('content:audit'), AuditController.refreshPartial);

module.exports = router;
