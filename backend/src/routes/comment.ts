import { Router } from 'express'
import * as commentController from '@controllers/comment'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', commentController.list)
router.get('/stats', commentController.getStats)
router.get('/sensitive-words', commentController.getSensitiveWords)
router.post('/check-compliance', commentController.checkCompliance)
router.post('/highlight', commentController.highlightContent)
router.post('/batch-audit', commentController.batchAudit)
router.post('/batch-delete', roleMiddleware('admin', 'risk_admin'), commentController.batchDelete)
router.post('/batch-mark-review', commentController.batchMarkReview)
router.get('/:id', commentController.detail)
router.get('/:id/trace', commentController.getTrace)
router.post('/', commentController.create)
router.put('/:id', commentController.update)
router.delete('/:id', commentController.remove)
router.post('/audit/:id', commentController.audit)

export default router
