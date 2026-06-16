import { Router } from 'express';
import * as authController from '@controllers/AuthController';
import { authenticate } from '@middlewares/auth';
import { authLimiter } from '@middlewares/rateLimiter';

const router = Router();

router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/current-user', authenticate, authController.getCurrentUser);

export default router;
