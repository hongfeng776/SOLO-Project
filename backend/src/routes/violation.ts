import { Router } from 'express'
import * as violationController from '@controllers/violation'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', violationController.list)
router.get('/stats', violationController.getStats)
router.get('/:id', violationController.detail)
router.post('/', violationController.create)
router.post('/:id/handle', violationController.handle)
router.post('/batch-handle', violationController.batchHandle)
router.post('/:id/appeal', violationController.appeal)
router.delete('/:id', violationController.remove)

export default router
