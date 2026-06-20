import { Router } from 'express';
import onboardController from '../controllers/onboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/prerequisites/:resumeId', authMiddleware, onboardController.checkPrerequisites);
router.get('/validate-salary', authMiddleware, onboardController.validateSalary);
router.get('/', authMiddleware, onboardController.getList);
router.get('/:id/operation-logs', authMiddleware, onboardController.getOperationLogs);
router.get('/:id', authMiddleware, onboardController.getDetail);

router.post('/', authMiddleware, onboardController.create);
router.post('/batch', authMiddleware, onboardController.batchCreate);
router.post('/batch-submit', authMiddleware, onboardController.batchSubmit);
router.post('/batch-approve', authMiddleware, onboardController.batchApprove);

router.put('/:id', authMiddleware, onboardController.update);
router.put('/:id/submit', authMiddleware, onboardController.submit);
router.put('/:id/approve', authMiddleware, onboardController.approve);
router.put('/:id/reject', authMiddleware, onboardController.reject);
router.put('/:id/resubmit', authMiddleware, onboardController.resubmit);
router.put('/:id/mark-onboarded', authMiddleware, onboardController.markOnboarded);

router.delete('/:id', authMiddleware, onboardController.remove);

export default router;
