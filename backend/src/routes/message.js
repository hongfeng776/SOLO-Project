const express = require('express');
const messageController = require('../controllers/MessageController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, messageController.getMessageList);
router.get('/unread-count', authenticate, messageController.getUnreadCount);
router.get('/:id', authenticate, messageController.getMessageById);
router.post('/', authenticate, requirePermission('message:create'), messageController.createMessage);
router.put('/read-all', authenticate, messageController.markAllAsRead);
router.put('/:id/read', authenticate, messageController.markAsRead);
router.delete('/:id', authenticate, messageController.deleteMessage);

module.exports = router;
