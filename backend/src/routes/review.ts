import { Router } from 'express'
import * as reviewController from '@controllers/review'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/queue', reviewController.getQueue)
router.get('/high-risk-count', reviewController.getHighRiskCount)
router.post('/execute', reviewController.executeReview)
router.post('/batch', reviewController.batchReview)
router.post('/double-click/:id', reviewController.doubleClickReview)

export default router
