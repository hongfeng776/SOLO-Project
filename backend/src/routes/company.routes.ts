import { Router } from 'express';
import companyController from '../controllers/company.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get('/', authMiddleware, companyController.getList);
router.get('/:id', authMiddleware, companyController.getDetail);
router.get('/:id/check-qualification', authMiddleware, companyController.checkQualificationApproved);
router.get('/matching/job-categories', authMiddleware, companyController.getMatchingJobCategories);
router.get('/matching/recruit-range', authMiddleware, companyController.getMatchingRecruitRange);
router.post('/validate', authMiddleware, companyController.validateData);
router.post('/:id/validate', authMiddleware, companyController.validateData);
router.post('/', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), companyController.create);
router.put('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), companyController.update);
router.put('/:id/approve-change', authMiddleware, roleMiddleware(UserRole.ADMIN), companyController.approveChange);
router.put('/:id/reject-change', authMiddleware, roleMiddleware(UserRole.ADMIN), companyController.rejectChange);
router.post('/batch-update', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), companyController.batchUpdate);
router.get('/change-logs/list', authMiddleware, companyController.getChangeLogs);
router.delete('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), companyController.remove);
router.post('/batch-remove', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), companyController.batchRemove);

export default router;
