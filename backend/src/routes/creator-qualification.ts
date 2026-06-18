import { Router } from 'express'
import * as creatorQualificationController from '@controllers/creator-qualification'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', creatorQualificationController.list)
router.get('/stats', creatorQualificationController.stats)
router.get('/expiring-soon', creatorQualificationController.getExpiringSoon)
router.get('/:id', creatorQualificationController.detail)
router.get('/:id/logs', creatorQualificationController.getLogs)
router.get('/creator/:creatorId', creatorQualificationController.getApplyByCreator)
router.get('/creator/:creatorId/trace', creatorQualificationController.getTraceLogs)
router.get('/creator/:creatorId/benefits', creatorQualificationController.getBenefitConfig)

router.post('/pre-check', creatorQualificationController.preCheck)
router.post('/', creatorQualificationController.create)
router.post('/check-fake', creatorQualificationController.checkFake)

router.use(roleMiddleware('admin', 'operation_manager'))

router.post('/:id/audit', creatorQualificationController.audit)
router.post('/batch-audit', creatorQualificationController.batchAudit)

export default router
