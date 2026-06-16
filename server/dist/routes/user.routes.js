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
router.use(auth_middleware_1.default);
router.get('/profile', controllers_1.userController.getProfile);
router.put('/profile', updateUserValidator, validate_middleware_1.default, controllers_1.userController.updateProfile);
router.post('/', createUserValidator, validate_middleware_1.default, controllers_1.userController.create);
router.get('/', controllers_1.userController.findAll);
router.get('/:id', controllers_1.userController.findById);
router.put('/:id', updateUserValidator, validate_middleware_1.default, controllers_1.userController.update);
router.delete('/:id', controllers_1.userController.delete);
exports.default = router;
//# sourceMappingURL=user.routes.js.map