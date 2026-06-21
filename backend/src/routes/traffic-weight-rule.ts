import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'
import * as weightRuleController from '@controllers/traffic-weight-rule'

const router = Router()

router.get(
  '/stats',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator', 'auditor'),
  weightRuleController.getStats
)

router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator', 'auditor'),
  weightRuleController.list
)

router.get(
  '/:id',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator', 'auditor'),
  weightRuleController.detail
)

router.post(
  '/validate',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator'),
  weightRuleController.validateCreate
)

router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator'),
  weightRuleController.createValidation,
  weightRuleController.create
)

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator'),
  weightRuleController.update
)

router.put(
  '/:id/enable',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator'),
  weightRuleController.enable
)

router.put(
  '/:id/disable',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator'),
  weightRuleController.disable
)

router.put(
  '/:id/adjust',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin'),
  weightRuleController.adjust
)

router.post(
  '/batch',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin'),
  weightRuleController.batchValidation,
  weightRuleController.batchOperation
)

router.put(
  '/:id/recalc',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator'),
  weightRuleController.recalc
)

router.get(
  '/logs/list',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'auditor'),
  weightRuleController.listLogs
)

router.get(
  '/:id/impact',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'auditor'),
  weightRuleController.getImpactAnalysis
)

export default router
