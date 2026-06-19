import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  batchUpdateTags,
  batchSuspend,
  batchResume,
  batchChangeLevel,
  getBatchScope,
} from '../controllers/ShopBatchController';

const router = Router();

router.use(authMiddleware);

router.post('/tags', batchUpdateTags);
router.post('/suspend', batchSuspend);
router.post('/resume', batchResume);
router.post('/level', batchChangeLevel);
router.get('/scope', getBatchScope);

export default router;
