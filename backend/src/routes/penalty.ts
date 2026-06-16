import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import PenaltyController from '../controllers/PenaltyController';

const router = Router();

router.use(authMiddleware);

router.post('/execute', PenaltyController.executePenalty);
router.post('/:id/revoke', PenaltyController.revokePenalty);
router.post('/checkViolation', PenaltyController.checkViolation);
router.post('/autoLiftExpired', PenaltyController.autoLiftExpired);
router.get('/list', PenaltyController.getPenaltyList);

export default router;
