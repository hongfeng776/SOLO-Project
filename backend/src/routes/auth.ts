import { Router } from 'express';
import { AuthController } from '../controllers';
import { requireAuth } from '../middlewares';

const router = Router();
const authController = new AuthController();

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', requireAuth, (req, res, next) => authController.logout(req, res, next));
router.get('/userinfo', requireAuth, (req, res, next) => authController.getUserInfo(req, res, next));
router.get('/captcha', (req, res, next) => authController.captcha(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/change-password', requireAuth, (req, res, next) => authController.changePassword(req, res, next));

export default router;
