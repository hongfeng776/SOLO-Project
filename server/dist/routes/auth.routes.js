"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const controllers_1 = require("../controllers");
const validate_middleware_1 = __importDefault(require("../middleware/validate.middleware"));
const router = (0, express_1.Router)();
const loginValidator = [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
const registerValidator = [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('nickname').optional().isLength({ max: 50 }).withMessage('Nickname must not exceed 50 characters'),
];
const refreshTokenValidator = [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
router.post('/login', loginValidator, validate_middleware_1.default, controllers_1.authController.login);
router.post('/register', registerValidator, validate_middleware_1.default, controllers_1.authController.register);
router.post('/refresh-token', refreshTokenValidator, validate_middleware_1.default, controllers_1.authController.refreshToken);
router.post('/logout', controllers_1.authController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map