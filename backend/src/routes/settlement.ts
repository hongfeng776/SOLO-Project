import { Router } from 'express'
import * as settlementController from '@controllers/settlement'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', settlementController.list)
router.get('/stats', settlementController.getStats)
router.get('/:id', settlementController.detail)
router.post('/', settlementController.create)
router.post('/:id/settle', settlementController.settle)
router.post('/:id/reject', settlementController.reject)
router.post('/batch-settle', settlementController.batchSettle)

export default router
