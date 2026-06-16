import { Router } from 'express';
import resumeController from '../controllers/resume.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, resumeController.getList);
router.get('/:id', authMiddleware, resumeController.getDetail);
router.post('/', authMiddleware, resumeController.create);
router.put('/:id', authMiddleware, resumeController.update);
router.delete('/:id', authMiddleware, resumeController.remove);
router.post('/batch-remove', authMiddleware, resumeController.batchRemove);
router.put('/:id/status', authMiddleware, resumeController.updateStatus);

export default router;
