import { Router } from 'express';
import companyController from '../controllers/company.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get('/', authMiddleware, companyController.getList);
router.get('/:id', authMiddleware, companyController.getDetail);
router.post('/', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), companyController.create);
router.put('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), companyController.update);
router.delete('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), companyController.remove);
router.post('/batch-remove', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), companyController.batchRemove);

export default router;
