const express = require('express');
const interactionAnalyticsController = require('../controllers/InteractionAnalyticsController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('analytics:view'), interactionAnalyticsController.getInteractionStats);
router.get('/trend', authenticate, requirePermission('analytics:view'), interactionAnalyticsController.getInteractionTrend);
router.get('/category-comparison', authenticate, requirePermission('analytics:view'), interactionAnalyticsController.getCategoryComparison);
router.post('/export', authenticate, requirePermission('analytics:view'), interactionAnalyticsController.batchExportReport);
router.post('/screen-low', authenticate, requirePermission('analytics:view'), interactionAnalyticsController.batchScreenLowInteraction);
router.get('/trace', authenticate, requirePermission('analytics:view'), interactionAnalyticsController.traceInteractionStats);
router.get('/check-duplicate', authenticate, requirePermission('analytics:view'), interactionAnalyticsController.checkDuplicateStat);
router.get('/validate-consistency', authenticate, requirePermission('analytics:view'), interactionAnalyticsController.validateInteractionConsistency);

module.exports = router;
