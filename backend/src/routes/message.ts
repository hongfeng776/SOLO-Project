import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import MessageController from '../controllers/MessageController';

const router = Router();

router.use(authMiddleware);

router.get('/list', MessageController.getMessageList);
router.post('/:id/read', MessageController.markAsRead);
router.post('/readAll', MessageController.markAllAsRead);
router.get('/stats', MessageController.getMessageStats);
router.delete('/:id', MessageController.deleteMessage);

export default router;
