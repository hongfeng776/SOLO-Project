"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
const statusCode_1 = require("../constants/statusCode");
const response_1 = __importDefault(require("../utils/response"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response_1.default.unauthorized(res, 'Missing or invalid authorization header', statusCode_1.BusinessCode.TOKEN_INVALID);
        return;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.secret);
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            response_1.default.unauthorized(res, 'Token expired', statusCode_1.BusinessCode.TOKEN_EXPIRED);
        }
        else {
            response_1.default.unauthorized(res, 'Invalid token', statusCode_1.BusinessCode.TOKEN_INVALID);
        }
    }
};
exports.default = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map