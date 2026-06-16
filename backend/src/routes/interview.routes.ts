import { Router } from 'express';
import interviewController from '../controllers/interview.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, interviewController.getList);
router.get('/:id', authMiddleware, interviewController.getDetail);
router.post('/', authMiddleware, interviewController.create);
router.put('/:id', authMiddleware, interviewController.update);
router.delete('/:id', authMiddleware, interviewController.remove);
router.post('/batch-remove', authMiddleware, interviewController.batchRemove);

export default router;
