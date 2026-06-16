import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers';
import validateMiddleware from '../middleware/validate.middleware';

const router = Router();

const loginValidator = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidator = [
  body('username').notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('nickname').optional().isLength({ max: 50 }).withMessage('Nickname must not exceed 50 characters'),
];

const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

router.post('/login', loginValidator, validateMiddleware, authController.login);
router.post('/register', registerValidator, validateMiddleware, authController.register);
router.post('/refresh-token', refreshTokenValidator, validateMiddleware, authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
