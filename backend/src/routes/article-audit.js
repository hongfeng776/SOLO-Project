const express = require('express');
const ArticleAuditController = require('../controllers/ArticleAuditController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/pool', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.getAuditPool);
router.get('/:articleId/detail', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.getDetail);
router.get('/:articleId/ai-screen', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.getAiPreScreen);
router.get('/:articleId/check-duplicate', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.checkDuplicate);
router.get('/:articleId/check-consistency', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.checkConsistency);
router.post('/:articleId/risks/:riskType/handle', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.handleAiRisk);
router.post('/submit', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.submitAudit);
router.post('/:articleId/review-suspected', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.reviewSuspected);
router.post('/batch-action', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.batchAction);
router.post('/export-ledger', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.exportLedger);
router.get('/trace/:articleCode', authenticate, requirePermission('content:audit', 'article:audit'), ArticleAuditController.getTraceRecord);
router.get('/qc-report', authenticate, requirePermission('audit:qc', 'article:qc'), ArticleAuditController.getQCReport);

module.exports = router;
