import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import categoryBatchController from '../controllers/CategoryBatchController';

const router = Router();

router.use(authMiddleware);

router.post('/toggle-status', categoryBatchController.batchToggleStatus);
router.post('/sort', categoryBatchController.batchSort);
router.post('/move', categoryBatchController.batchMove);
router.post('/ability', categoryBatchController.getBatchAbility);

export default router;
