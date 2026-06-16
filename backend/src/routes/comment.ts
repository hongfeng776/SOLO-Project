import { Router } from 'express'
import * as commentController from '@controllers/comment'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', commentController.list)
router.get('/stats', commentController.getStats)
router.get('/:id', commentController.detail)
router.post('/', commentController.create)
router.put('/:id', commentController.update)
router.delete('/:id', commentController.remove)
router.post('/audit/:id', commentController.audit)
router.post('/batch-audit', commentController.batchAudit)
router.post('/batch-delete', commentController.batchDelete)

export default router
