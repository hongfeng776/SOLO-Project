import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getBatchOrderList,
  batchRemind,
  batchMarkException,
  batchArchive,
  batchRemindByQuery,
  batchMarkExceptionByQuery,
  batchArchiveByQuery,
} from '../controllers/OrderBatchController';

const router = Router();

router.use(authMiddleware);

router.get('/list', getBatchOrderList);
router.post('/remind', batchRemind);
router.post('/markException', batchMarkException);
router.post('/archive', batchArchive);
router.post('/remindByQuery', batchRemindByQuery);
router.post('/markExceptionByQuery', batchMarkExceptionByQuery);
router.post('/archiveByQuery', batchArchiveByQuery);

export default router;
