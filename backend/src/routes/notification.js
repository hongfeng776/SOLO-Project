const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notificationController')

router.get('/', notificationController.getList)
router.get('/unread-count', notificationController.getUnreadCount)
router.put('/read/:id', notificationController.markRead)
router.put('/read-all', notificationController.markAllRead)
router.post('/', notificationController.send)
router.delete('/:id', notificationController.deleteNotification)

module.exports = router
