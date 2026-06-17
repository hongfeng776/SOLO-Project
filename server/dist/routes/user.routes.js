"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const controllers_1 = require("../controllers");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const validate_middleware_1 = __importDefault(require("../middleware/validate.middleware"));
const router = (0, express_1.Router)();
const createUserValidator = [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('nickname').optional().isLength({ max: 50 }).withMessage('Nickname must not exceed 50 characters'),
    (0, express_validator_1.body)('role').optional().isIn(['admin', 'user', 'guest']).withMessage('Invalid role'),
];
const updateUserValidator = [
    (0, express_validator_1.body)('nickname').optional().isLength({ max: 50 }).withMessage('Nickname must not exceed 50 characters'),
    (0, express_validator_1.body)('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('role').optional().isIn(['admin', 'user', 'guest']).withMessage('Invalid role'),
    (0, express_validator_1.body)('status').optional().isIn([0, 1]).withMessage('Invalid status'),
];
const createAdminValidator = [
    (0, express_validator_1.body)('username').notEmpty().withMessage('用户名必填')
        .isLength({ min: 3, max: 50 }).withMessage('用户名长度需在3-50字符之间'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('密码必填')
        .isLength({ min: 6 }).withMessage('密码至少6位'),
    (0, express_validator_1.body)('nickname').notEmpty().withMessage('昵称必填')
        .isLength({ max: 50 }).withMessage('昵称不超过50字符'),
    (0, express_validator_1.body)('email').notEmpty().withMessage('邮箱必填')
        .isEmail().withMessage('邮箱格式不正确'),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('手机号必填'),
    (0, express_validator_1.body)('role').notEmpty().withMessage('角色必填')
        .isIn(['admin', 'user', 'guest']).withMessage('无效的角色值'),
];
router.use(auth_middleware_1.default);
router.get('/profile', controllers_1.userController.getProfile);
router.put('/profile', updateUserValidator, validate_middleware_1.default, controllers_1.userController.updateProfile);
router.post('/', createUserValidator, validate_middleware_1.default, controllers_1.userController.create);
router.get('/', controllers_1.userController.findAll);
router.get('/:id', controllers_1.userController.findById);
router.put('/:id', updateUserValidator, validate_middleware_1.default, controllers_1.userController.update);
router.delete('/:id', controllers_1.userController.delete);
router.post('/admins', createAdminValidator, validate_middleware_1.default, controllers_1.userController.createAdmin);
router.put('/admins/:id', controllers_1.userController.updateAdmin);
router.get('/admins', controllers_1.userController.findAllAdvanced);
router.post('/admins/batch-status', controllers_1.userController.batchUpdateStatus);
router.post('/admins/batch-reset', controllers_1.userController.batchResetPermissions);
router.get('/admins/:id/dependencies', controllers_1.userController.checkDeleteDependencies);
router.delete('/admins/:id', controllers_1.userController.deleteAdmin);
router.get('/admins/:id/trace', controllers_1.userController.getUserTraceInfo);
router.get('/admins/permission-exclusions', controllers_1.userController.getPermissionMutualExclusionRules);
exports.default = router;
//# sourceMappingURL=user.routes.js.map