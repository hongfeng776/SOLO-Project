const express = require('express')
const router = express.Router()
const dashboardController = require('../controllers/dashboardController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/statistics', authMiddleware(), dashboardController.getStatistics)
router.get('/resource-stats', authMiddleware(), dashboardController.getResourceStats)
router.get('/status-distribution', authMiddleware(), dashboardController.getStatusDistribution)
router.get('/recent-resources', authMiddleware(), dashboardController.getRecentResources)
router.get('/recent-audits', authMiddleware(), dashboardController.getRecentAudits)
router.get('/hot-rank', authMiddleware(), dashboardController.getResourceHotRank)
router.get('/user-activity', authMiddleware(), dashboardController.getUserActivityStats)
router.get('/member-stats', authMiddleware(), dashboardController.getMemberStats)
router.get('/category-stats', authMiddleware(), dashboardController.getCategoryStats)
router.get('/violation-overview', authMiddleware(), dashboardController.getViolationOverview)
router.get('/log-stats', authMiddleware(), dashboardController.getOperationLogStats)
router.get('/conversion', authMiddleware(), dashboardController.getConversionStats)

module.exports = router
