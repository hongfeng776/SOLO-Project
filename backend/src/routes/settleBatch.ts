import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  checkPermission,
  apply,
  batchApply,
  batchAudit,
  batchExport,
  getList,
} from '../controllers/SettleBatchController';

const router = Router();

router.use(authMiddleware);

router.post('/checkPermission', checkPermission);
router.post('/apply', apply);
router.post('/batchApply', batchApply);
router.post('/batchAudit', batchAudit);
router.post('/batchExport', batchExport);
router.get('/getList', getList);

export default router;
