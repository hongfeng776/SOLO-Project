const express = require('express')
const router = express.Router()
const dataAnalyticsController = require('../controllers/dataAnalyticsController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/overview', authMiddleware(), dataAnalyticsController.getOverview)

router.post(
  '/validate',
  authMiddleware(),
  dataAnalyticsController.preValidate
)

router.get(
  '/resources',
  authMiddleware(),
  dataAnalyticsController.getDataList
)

router.get(
  '/resources/:id',
  authMiddleware(),
  dataAnalyticsController.getResourceDetail
)

router.get(
  '/resources/:id/trace',
  authMiddleware(),
  dataAnalyticsController.traceResourceData
)

router.post(
  '/batch-summary',
  authMiddleware(),
  roleMiddleware('super_admin', 'admin', 'operator', 'auditor'),
  dataAnalyticsController.batchSummary
)

router.get(
  '/query-logs',
  authMiddleware(),
  dataAnalyticsController.getQueryLogs
)

module.exports = router
