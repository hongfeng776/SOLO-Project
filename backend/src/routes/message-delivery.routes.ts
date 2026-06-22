import { Router } from 'express';
import messageDeliveryController from '../controllers/message-delivery.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.use(authMiddleware);

router.get('/list', messageDeliveryController.getMessageList);
router.get('/detail/:id', messageDeliveryController.getMessageDetail);
router.get('/unread-count', messageDeliveryController.getUnreadCount);
router.get('/stats', messageDeliveryController.getStats);
router.get('/logs/:id', messageDeliveryController.getMessageLogs);

router.post('/trigger', messageDeliveryController.triggerMessage);
router.put('/read/:id', messageDeliveryController.markAsRead);
router.put('/unread/:id', messageDeliveryController.markAsUnread);
router.put('/read-all', messageDeliveryController.markAllAsRead);
router.put('/retry/:id', messageDeliveryController.retryMessage);

router.post('/batch-retry', messageDeliveryController.batchRetry);
router.post('/batch-mark-read', messageDeliveryController.batchMarkRead);
router.post('/batch-delete', messageDeliveryController.batchDelete);
router.post('/batch-mark-overdue', messageDeliveryController.batchMarkOverdueUnread);

router.delete('/:id', messageDeliveryController.deleteMessage);

router.post('/admin/clear-history',
  roleMiddleware(UserRole.ADMIN),
  messageDeliveryController.adminClearHistory
);

export default router;
