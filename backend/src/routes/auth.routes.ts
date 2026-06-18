import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.post('/login', authController.login);
router.post('/verify-login', authController.verifyLogin);
router.get('/userinfo', authMiddleware, authController.getUserInfo);

router.get('/users', authMiddleware, roleMiddleware(UserRole.ADMIN), authController.getList);
router.get('/users/:id', authMiddleware, roleMiddleware(UserRole.ADMIN), authController.getDetail);
router.post('/users', authMiddleware, roleMiddleware(UserRole.ADMIN), authController.create);
router.put('/users/:id', authMiddleware, roleMiddleware(UserRole.ADMIN), authController.update);
router.delete('/users/:id', authMiddleware, roleMiddleware(UserRole.ADMIN), authController.remove);

export default router;
