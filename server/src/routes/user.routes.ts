import { Router } from 'express';
import { body, query } from 'express-validator';
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

const createAdminValidator = [
  body('username').notEmpty().withMessage('用户名必填')
    .isLength({ min: 3, max: 50 }).withMessage('用户名长度需在3-50字符之间'),
  body('password').notEmpty().withMessage('密码必填')
    .isLength({ min: 6 }).withMessage('密码至少6位'),
  body('nickname').notEmpty().withMessage('昵称必填')
    .isLength({ max: 50 }).withMessage('昵称不超过50字符'),
  body('email').notEmpty().withMessage('邮箱必填')
    .isEmail().withMessage('邮箱格式不正确'),
  body('phone').notEmpty().withMessage('手机号必填'),
  body('role').notEmpty().withMessage('角色必填')
    .isIn(['admin', 'user', 'guest']).withMessage('无效的角色值'),
];

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', updateUserValidator, validateMiddleware, userController.updateProfile);

router.post('/', createUserValidator, validateMiddleware, userController.create);
router.get('/', userController.findAll);
router.get('/:id', userController.findById);
router.put('/:id', updateUserValidator, validateMiddleware, userController.update);
router.delete('/:id', userController.delete);

router.post('/admins', createAdminValidator, validateMiddleware, userController.createAdmin);
router.put('/admins/:id', userController.updateAdmin);
router.get('/admins', userController.findAllAdvanced);
router.post('/admins/batch-status', userController.batchUpdateStatus);
router.post('/admins/batch-reset', userController.batchResetPermissions);
router.get('/admins/:id/dependencies', userController.checkDeleteDependencies);
router.delete('/admins/:id', userController.deleteAdmin);
router.get('/admins/:id/trace', userController.getUserTraceInfo);
router.get('/admins/permission-exclusions', userController.getPermissionMutualExclusionRules);

export default router;
