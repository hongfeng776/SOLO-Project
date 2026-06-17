import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import GoodsAuditController from '../controllers/GoodsAuditController';

const router = Router();

router.use(authMiddleware);

router.post('/submit', GoodsAuditController.submitAudit);
router.post('/:id/withdraw', GoodsAuditController.withdrawAudit);
router.post('/:id/resubmit', GoodsAuditController.resubmitAudit);
router.get('/list', GoodsAuditController.getAuditList);
router.get('/:id', GoodsAuditController.getAuditDetail);

export default router;
