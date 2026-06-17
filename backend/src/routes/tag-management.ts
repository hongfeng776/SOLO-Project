import { Router } from 'express'
import * as tagController from '@controllers/tag-management'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', tagController.list)
router.get('/usage-logs', tagController.getUsageLogs)
router.get('/review-report', tagController.getReviewReport)
router.get('/:id', tagController.detail)
router.post('/', tagController.create)
router.post('/validate', tagController.validateBeforeCreate)
router.post('/batch', tagController.batchOperations)
router.post('/clean-unused', roleMiddleware('admin', 'super_ops'), tagController.cleanUnused)
router.put('/:id', tagController.update)
router.delete('/:id', tagController.remove)
router.patch('/:id/status', tagController.toggleStatus)

export default router
