import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import categoryTraceController from '../controllers/CategoryTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/full-trace/:id', categoryTraceController.getCategoryFullTrace);
router.get('/check-constraints', categoryTraceController.checkConstraints);
router.get('/tree-stats', categoryTraceController.getTreeWithStats);
router.get('/flat-list', categoryTraceController.getFlatListWithStats);

export default router;
