const express = require('express');
const dashboardController = require('../controllers/DashboardController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticate, dashboardController.getDashboardStats);
router.get('/play-trend', authenticate, dashboardController.getPlayTrend);
router.get('/audit-efficiency', authenticate, requirePermission('content:audit'), dashboardController.getAuditEfficiency);
router.get('/revenue-overview', authenticate, requirePermission('ad:view'), dashboardController.getRevenueOverview);

module.exports = router;
