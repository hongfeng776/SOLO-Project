import { Router } from 'express'
import * as activityController from '@controllers/activity'
import * as orderController from '@controllers/order'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/list', activityController.list)
router.get('/list/:id', activityController.detail)
router.post('/list', activityController.create)
router.put('/list/:id', activityController.update)
router.delete('/list/:id', activityController.remove)

router.get('/orders', orderController.list)
router.get('/orders/stats', orderController.getStats)
router.get('/orders/:id', orderController.detail)
router.post('/orders', orderController.create)
router.put('/orders/:id', orderController.update)
router.put('/orders/:id/status', orderController.updateStatus)
router.post('/orders/batch-update-status', orderController.batchUpdateStatus)
router.delete('/orders/:id', orderController.remove)

export default router
