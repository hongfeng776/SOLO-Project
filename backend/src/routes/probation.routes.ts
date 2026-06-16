import { Router } from 'express';
import probationController from '../controllers/probation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, probationController.getList);
router.get('/expiring-soon', authMiddleware, probationController.getExpiringSoon);
router.get('/:id', authMiddleware, probationController.getDetail);
router.post('/', authMiddleware, probationController.create);
router.put('/:id', authMiddleware, probationController.update);
router.delete('/:id', authMiddleware, probationController.remove);
router.put('/:id/review', authMiddleware, probationController.startReview);
router.put('/:id/pass', authMiddleware, probationController.passProbation);
router.put('/:id/fail', authMiddleware, probationController.failProbation);
router.put('/:id/extend', authMiddleware, probationController.extendProbation);

export default router;
