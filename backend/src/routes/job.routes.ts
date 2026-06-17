import { Router } from 'express';
import jobController from '../controllers/job.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get('/', authMiddleware, jobController.getList);
router.get('/:id', authMiddleware, jobController.getDetail);
router.post('/', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.create);
router.put('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.update);
router.delete('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.remove);
router.post('/batch-remove', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.batchRemove);

router.put('/:id/submit-audit', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.submitAudit);
router.put('/:id/approve', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.approve);
router.put('/:id/reject', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.reject);

router.put('/:id/publish', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.publish);
router.put('/:id/close', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.close);

router.post('/batch-create', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.batchCreate);
router.post('/batch-submit-audit', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.batchSubmitAudit);
router.post('/batch-approve', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.batchApprove);

router.get('/:id/operation-logs', authMiddleware, jobController.getOperationLogs);
router.get('/:id/validate-submit', authMiddleware, jobController.validateForSubmit);
router.get('/pre-check/:companyId', authMiddleware, jobController.getPreCheckInfo);
router.get('/batch-fill/config', authMiddleware, jobController.getBatchFillConfig);

export default router;
