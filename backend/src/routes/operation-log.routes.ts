import { Router } from 'express';
import operationLogController from '../controllers/operation-log.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get(
  '/',
  authMiddleware,
  roleMiddleware(UserRole.ADMIN),
  operationLogController.getList
);
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.ADMIN),
  operationLogController.getDetail
);

export default router;
