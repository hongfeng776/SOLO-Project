import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import GoodsAuditReviewController from '../controllers/GoodsAuditReviewController';

const router = Router();

router.use(authMiddleware);

router.get('/riskLevel', GoodsAuditReviewController.getRiskLevel);
router.post('/:id/initialReview', GoodsAuditReviewController.executeInitialReview);
router.post('/:id/finalReview', GoodsAuditReviewController.executeFinalReview);
router.post('/:id/freeze', GoodsAuditReviewController.freezeAudit);
router.post('/:id/unfreeze', GoodsAuditReviewController.unfreezeAudit);
router.post('/checkTimeout', GoodsAuditReviewController.checkTimeout);

export default router;
