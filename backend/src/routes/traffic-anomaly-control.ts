import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'
import * as anomalyController from '@controllers/traffic-anomaly-control'

const router = Router()

router.get(
  '/stats',
  authMiddleware,
  roleMiddleware('admin', 'risk_admin', 'senior_operator', 'operator'),
  anomalyController.getStats
)

router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'risk_admin', 'senior_operator', 'operator'),
  anomalyController.list
)

router.get(
  '/logs',
  authMiddleware,
  roleMiddleware('admin', 'risk_admin', 'senior_operator', 'operator'),
  anomalyController.listLogs
)

router.get(
  '/:id',
  authMiddleware,
  roleMiddleware('admin', 'risk_admin', 'senior_operator', 'operator'),
  anomalyController.detail
)

router.get(
  '/:id/impact',
  authMiddleware,
  roleMiddleware('admin', 'risk_admin', 'senior_operator', 'operator'),
  anomalyController.impactAnalysis
)

router.post(
  '/detect',
  authMiddleware,
  roleMiddleware('admin', 'risk_admin', 'senior_operator'),
  anomalyController.detectValidation,
  anomalyController.detect
)

router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'risk_admin', 'senior_operator'),
  anomalyController.create
)

router.put(
  '/:id/handle',
  authMiddleware,
  roleMiddleware('admin', 'risk_admin', 'senior_operator'),
  anomalyController.handleValidation,
  anomalyController.handle
)

router.post(
  '/batch',
  authMiddleware,
  roleMiddleware('admin', 'risk_admin'),
  anomalyController.batchValidation,
  anomalyController.batchHandle
)

export default router
