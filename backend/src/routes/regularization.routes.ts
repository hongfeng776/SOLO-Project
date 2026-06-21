import { Router } from 'express';
import regularizationController from '../controllers/regularization.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/list', authMiddleware, regularizationController.getList);
router.get('/pending', authMiddleware, regularizationController.getPending);
router.get('/prerequisites/check', authMiddleware, regularizationController.checkPrerequisites);
router.get('/approval-flow', authMiddleware, regularizationController.getApprovalFlow);
router.get('/stats/pass-rate', authMiddleware, regularizationController.getPassRateReport);
router.get('/progress/:id', authMiddleware, regularizationController.getProgress);

router.get('/:id/detail', authMiddleware, regularizationController.getDetail);
router.get('/:id', authMiddleware, regularizationController.getById);

router.post('/validate-compliance', authMiddleware, regularizationController.validateCompliance);
router.post('/batch/filter', authMiddleware, regularizationController.batchFilter);
router.post('/batch/apply', authMiddleware, regularizationController.batchApply);
router.post('/batch/approve', authMiddleware, regularizationController.batchApprove);
router.post('/sync-pending', authMiddleware, regularizationController.syncPending);
router.post('/', authMiddleware, regularizationController.createApply);

router.put('/:id/approve', authMiddleware, regularizationController.approveNode);
router.put('/:id/reject', authMiddleware, regularizationController.rejectNode);
router.put('/:id/resubmit', authMiddleware, regularizationController.resubmit);

export default router;
