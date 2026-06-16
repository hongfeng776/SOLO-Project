const express = require('express')
const router = express.Router()
const dashboardController = require('../controllers/dashboardController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/statistics', authMiddleware(), dashboardController.getStatistics)
router.get('/resource-stats', authMiddleware(), dashboardController.getResourceStats)
router.get('/status-distribution', authMiddleware(), dashboardController.getStatusDistribution)
router.get('/recent-resources', authMiddleware(), dashboardController.getRecentResources)
router.get('/recent-audits', authMiddleware(), dashboardController.getRecentAudits)

module.exports = router
