const express = require('express');
const CommentAuditController = require('../controllers/CommentAuditController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/pool', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.getAuditPool);
router.get('/:commentId/detail', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.getDetail);
router.get('/:commentId/check-duplicate', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.checkDuplicate);
router.post('/submit', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.submitAudit);
router.post('/batch-action', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.batchAction);
router.get('/batch-progress/:batchId', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.getBatchProgress);
router.post('/refresh-partial', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.refreshPartial);
router.get('/trace/:commentId', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.getTraceRecord);
router.get('/qc-report', authenticate, requirePermission('audit:qc', 'comment:qc'), CommentAuditController.getQCReport);
router.post('/check-punishment', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.checkPunishment);
router.get('/constants', authenticate, requirePermission('content:audit', 'comment:audit'), CommentAuditController.getConstants);

module.exports = router;
