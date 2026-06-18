import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getAfterSaleList,
  getFilteredIds,
  batchAudit,
  batchCloseInvalid,
  batchArchiveTerminated,
} from '../controllers/AfterSaleBatchController';

const router = Router();

router.use(authMiddleware);

router.get('/list', getAfterSaleList);
router.post('/filtered-ids', getFilteredIds);
router.post('/batch-audit', batchAudit);
router.post('/batch-close', batchCloseInvalid);
router.post('/batch-archive', batchArchiveTerminated);

export default router;
