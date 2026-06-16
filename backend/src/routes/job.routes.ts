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
router.put('/:id/publish', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.publish);
router.put('/:id/close', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.close);

export default router;
