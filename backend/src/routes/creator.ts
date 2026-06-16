import { Router } from 'express'
import * as creatorController from '@controllers/creator'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', creatorController.list)
router.get('/stats', creatorController.stats)
router.get('/trend', creatorController.trend)
router.get('/:id', creatorController.detail)
router.post('/', creatorController.create)
router.put('/:id', creatorController.update)
router.post('/:id/qualification', creatorController.auditQualification)
router.post('/batch-change-status', creatorController.batchChangeStatus)
router.delete('/:id', creatorController.remove)

export default router
