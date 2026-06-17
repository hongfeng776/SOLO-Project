import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import GoodsAuditValidateController from '../controllers/GoodsAuditValidateController';

const router = Router();

router.use(authMiddleware);

router.get('/preSubmit', GoodsAuditValidateController.validatePreSubmit);
router.get('/missingFields', GoodsAuditValidateController.getMissingFields);
router.get('/canResubmit', GoodsAuditValidateController.canResubmit);
router.post('/autoInitialReview', GoodsAuditValidateController.autoInitialReview);
router.get('/checkDuplicate', GoodsAuditValidateController.checkDuplicate);

export default router;
