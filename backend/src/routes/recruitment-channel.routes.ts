import { Router } from 'express';
import recruitmentChannelController from '../controllers/recruitment-channel.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get('/', authMiddleware, recruitmentChannelController.getList);
router.get('/all/enabled', authMiddleware, recruitmentChannelController.getAllEnabled);
router.get('/:id', authMiddleware, recruitmentChannelController.getDetail);
router.post(
  '/',
  authMiddleware,
  roleMiddleware(UserRole.ADMIN, UserRole.HR),
  recruitmentChannelController.create
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.ADMIN, UserRole.HR),
  recruitmentChannelController.update
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.ADMIN, UserRole.HR),
  recruitmentChannelController.remove
);
router.post(
  '/batch-remove',
  authMiddleware,
  roleMiddleware(UserRole.ADMIN, UserRole.HR),
  recruitmentChannelController.batchRemove
);

export default router;
