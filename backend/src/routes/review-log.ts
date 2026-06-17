import { Router } from 'express'
import * as reviewLogController from '@controllers/review-log'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', reviewLogController.list)
router.get('/note/:noteId', reviewLogController.getNoteHistory)
router.get('/reviewer-stats/:reviewerId', reviewLogController.getReviewerStats)
router.get('/:id', reviewLogController.detail)

export default router
