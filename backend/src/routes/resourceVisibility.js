const express = require('express')
const router = express.Router()
const resourceVisibilityController = require('../controllers/resourceVisibilityController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/stats', authMiddleware(), resourceVisibilityController.getVisibilityStats)

router.get('/logs', authMiddleware(), resourceVisibilityController.getVisibilityLogs)

router.get(
  '/resources',
  authMiddleware(),
  resourceVisibilityController.getVisibilityList
)

router.get(
  '/resources/:id',
  authMiddleware(),
  resourceVisibilityController.getResourceVisibilityDetail
)

router.post(
  '/validate',
  authMiddleware(),
  roleMiddleware('super_admin', 'admin', 'operator', 'auditor'),
  resourceVisibilityController.preValidate
)

router.post(
  '/resources/:id/change',
  authMiddleware(),
  roleMiddleware('super_admin', 'admin', 'operator', 'auditor'),
  resourceVisibilityController.changeVisibility
)

router.post(
  '/batch-change',
  authMiddleware(),
  roleMiddleware('super_admin', 'admin', 'operator', 'auditor'),
  resourceVisibilityController.batchChangeVisibility
)

router.post(
  '/audit/:logId',
  authMiddleware(),
  roleMiddleware('super_admin', 'admin', 'auditor'),
  resourceVisibilityController.auditVisibility
)

module.exports = router
