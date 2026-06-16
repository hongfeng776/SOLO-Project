import { Router } from 'express'
import * as feedbackController from '@controllers/feedback'
import { authMiddleware, optionalAuth } from '@middlewares/auth'

const router = Router()

router.post('/', optionalAuth, feedbackController.create)

router.use(authMiddleware)

router.get('/', feedbackController.list)
router.get('/stats', feedbackController.getStats)
router.get('/:id', feedbackController.detail)
router.post('/:id/handle', feedbackController.handle)
router.post('/batch-handle', feedbackController.batchHandle)
router.post('/:id/close', feedbackController.close)
router.delete('/:id', feedbackController.remove)

export default router
