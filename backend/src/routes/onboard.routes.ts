import { Router } from 'express';
import onboardController from '../controllers/onboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, onboardController.getList);
router.get('/:id', authMiddleware, onboardController.getDetail);
router.post('/', authMiddleware, onboardController.create);
router.put('/:id', authMiddleware, onboardController.update);
router.delete('/:id', authMiddleware, onboardController.remove);
router.put('/:id/confirm', authMiddleware, onboardController.confirm);
router.put('/:id/onboarded', authMiddleware, onboardController.markOnboarded);
router.put('/:id/cancel', authMiddleware, onboardController.cancel);

export default router;
