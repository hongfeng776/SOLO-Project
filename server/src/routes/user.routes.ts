import { Router } from 'express';
import { body } from 'express-validator';
import { userController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';
import validateMiddleware from '../middleware/validate.middleware';

const router = Router();

const createUserValidator = [
  body('username').notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('nickname').optional().isLength({ max: 50 }).withMessage('Nickname must not exceed 50 characters'),
  body('role').optional().isIn(['admin', 'user', 'guest']).withMessage('Invalid role'),
];

const updateUserValidator = [
  body('nickname').optional().isLength({ max: 50 }).withMessage('Nickname must not exceed 50 characters'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'user', 'guest']).withMessage('Invalid role'),
  body('status').optional().isIn([0, 1]).withMessage('Invalid status'),
];

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', updateUserValidator, validateMiddleware, userController.updateProfile);

router.post('/', createUserValidator, validateMiddleware, userController.create);
router.get('/', userController.findAll);
router.get('/:id', userController.findById);
router.put('/:id', updateUserValidator, validateMiddleware, userController.update);
router.delete('/:id', userController.delete);

export default router;
