import { Router } from 'express';
import qualificationController from '../controllers/qualification.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get('/', authMiddleware, qualificationController.getList);
router.get('/:id', authMiddleware, qualificationController.getDetail);
router.get('/:id/audit-logs', authMiddleware, qualificationController.getAuditLogs);
router.get('/validate/credit-code/:code', authMiddleware, qualificationController.validateCreditCode);
router.get('/check/duplicate', authMiddleware, qualificationController.checkDuplicate);

router.post('/', authMiddleware, qualificationController.create);
router.post('/batch-import', authMiddleware, qualificationController.batchImport);
router.post('/validate', authMiddleware, qualificationController.validateForSubmit);
router.post('/batch-remove', authMiddleware, qualificationController.batchRemove);

router.put('/:id', authMiddleware, qualificationController.update);
router.put('/:id/approve', authMiddleware, roleMiddleware(UserRole.ADMIN), qualificationController.approve);
router.put('/:id/reject', authMiddleware, roleMiddleware(UserRole.ADMIN), qualificationController.reject);
router.put('/:id/invalidate', authMiddleware, roleMiddleware(UserRole.ADMIN), qualificationController.invalidate);

router.delete('/:id', authMiddleware, qualificationController.remove);

export default router;
