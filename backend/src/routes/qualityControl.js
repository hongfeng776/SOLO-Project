const express = require('express')
const router = express.Router()
const qualityControlController = require('../controllers/qualityControlController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/stats', authMiddleware(), qualityControlController.getStats)

router.get(
  '/resources',
  authMiddleware(),
  qualityControlController.getQualityList
)

router.get(
  '/resources/:id',
  authMiddleware(),
  qualityControlController.getResourceQualityDetail
)

router.get(
  '/assessment-logs',
  authMiddleware(),
  qualityControlController.getAssessmentLogs
)

router.get(
  '/review-logs',
  authMiddleware(),
  qualityControlController.getReviewLogs
)

router.post(
  '/resources/:id/assess',
  authMiddleware(),
  roleMiddleware('super_admin', 'admin', 'operator', 'auditor'),
  qualityControlController.assessResource
)

router.post(
  '/batch-assess',
  authMiddleware(),
  roleMiddleware('super_admin', 'admin', 'operator', 'auditor'),
  qualityControlController.batchAssess
)

router.post(
  '/resources/:id/review',
  authMiddleware(),
  roleMiddleware('super_admin', 'admin', 'auditor'),
  qualityControlController.reviewResource
)

module.exports = router
