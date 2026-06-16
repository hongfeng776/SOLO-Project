import { Router } from 'express';
import {
  getCaptcha,
  login,
  logout,
  getUserInfo,
  refreshToken,
} from '../controllers/AuthController';

const router = Router();

router.get('/captcha', getCaptcha);
router.post('/login', login);
router.post('/logout', logout);
router.get('/userInfo', getUserInfo);
router.post('/refreshToken', refreshToken);

export default router;
