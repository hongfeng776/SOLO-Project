const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notificationController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), notificationController.getList)
router.get('/unread-count', authMiddleware(), notificationController.getUnreadCount)
router.put('/:id/read', authMiddleware(), notificationController.markAsRead)
router.put('/read-all', authMiddleware(), notificationController.markAllAsRead)
router.post('/', authMiddleware(), notificationController.create)

module.exports = router
