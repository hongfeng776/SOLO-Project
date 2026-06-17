import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import goodsTraceController from '../controllers/GoodsTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/full-trace/:id', goodsTraceController.getGoodsFullTrace);
router.get('/consistency/:id', goodsTraceController.checkDataConsistency);
router.get('/repeat-suggestions/:id', goodsTraceController.getRepeatSuggestions);

export default router;
