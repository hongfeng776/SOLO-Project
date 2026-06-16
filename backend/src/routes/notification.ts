import { Router } from 'express'
import * as notificationController from '@controllers/notification'
import { authMiddleware, optionalAuth } from '@middlewares/auth'

const router = Router()

router.post('/', optionalAuth, notificationController.create)

router.use(authMiddleware)

router.get('/', notificationController.list)
router.get('/unread-count', notificationController.unreadCount)
router.get('/:id', notificationController.detail)
router.post('/:id/read', notificationController.markAsRead)
router.post('/read-all', notificationController.markAllAsRead)
router.delete('/:id', notificationController.remove)

export default router
