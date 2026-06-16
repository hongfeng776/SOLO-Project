const express = require('express')
const router = express.Router()
const monitorController = require('../controllers/monitorController')

router.get('/system-status', monitorController.getSystemStatus)
router.get('/api-metrics', monitorController.getApiMetrics)
router.get('/operation-logs', monitorController.getOperationLogs)
router.get('/alerts', monitorController.getAlertList)
router.get('/health', monitorController.getHealthCheck)

module.exports = router
