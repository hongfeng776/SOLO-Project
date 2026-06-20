import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'
import * as contentPushController from '@controllers/content-push'

const router = Router()

router.get(
  '/stats',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator', 'auditor'),
  contentPushController.getStats
)

router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator', 'auditor'),
  contentPushController.list
)

router.get(
  '/:id',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator', 'auditor'),
  contentPushController.detail
)

router.post(
  '/validate',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator'),
  contentPushController.validateCreate
)

router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator'),
  contentPushController.createValidation,
  contentPushController.create
)

router.put(
  '/:id/start',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator'),
  contentPushController.startPush
)

router.put(
  '/:id/pause',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator'),
  contentPushController.pausePush
)

router.put(
  '/:id/terminate',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator'),
  contentPushController.terminatePush
)

router.put(
  '/:id/strength',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator'),
  contentPushController.adjustStrength
)

router.post(
  '/batch',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator'),
  contentPushController.batchValidation,
  contentPushController.batchOperation
)

router.put(
  '/:id/refresh-stats',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator', 'auditor'),
  contentPushController.refreshStats
)

router.get(
  '/trace/list',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'auditor'),
  contentPushController.listTraces
)

router.get(
  '/:id/chain',
  authMiddleware,
  roleMiddleware('admin', 'operation_admin', 'senior_operator', 'auditor'),
  contentPushController.getFullChain
)

export default router
