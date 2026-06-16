"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
const dao_1 = require("../dao");
const enum_1 = require("../constants/enum");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
class AuthService {
    async hashPassword(password) {
        return bcryptjs_1.default.hash(password, jwt_1.bcryptConfig.saltRounds);
    }
    async comparePassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, jwt_1.jwtConfig.secret, { expiresIn: jwt_1.jwtConfig.expiresIn });
    }
    generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, jwt_1.jwtConfig.refreshSecret, { expiresIn: jwt_1.jwtConfig.refreshExpiresIn });
    }
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.secret);
    }
    verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.refreshSecret);
    }
    async login(data) {
        const user = await dao_1.userDao.findByUsername(data.username);
        if (!user) {
            throw new error_middleware_1.AppError('User not found', statusCode_1.BusinessCode.USER_NOT_FOUND);
        }
        if (user.status === enum_1.UserStatus.DISABLED) {
            throw new error_middleware_1.AppError('User is disabled', statusCode_1.BusinessCode.USER_DISABLED);
        }
        const isPasswordValid = await this.comparePassword(data.password, user.password);
        if (!isPasswordValid) {
            throw new error_middleware_1.AppError('Invalid password', statusCode_1.BusinessCode.USER_PASSWORD_ERROR);
        }
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
        };
        const token = this.generateToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        await dao_1.userDao.update({ lastLoginAt: new Date() }, { where: { id: user.id } });
        return {
            token,
            refreshToken,
            expiresIn: 7 * 24 * 60 * 60,
            user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                role: user.role,
            },
        };
    }
    async register(data) {
        const exists = await dao_1.userDao.existsByUsername(data.username);
        if (exists) {
            throw new error_middleware_1.AppError('Username already exists', statusCode_1.BusinessCode.USER_ALREADY_EXISTS);
        }
        const hashedPassword = await this.hashPassword(data.password);
        const user = await dao_1.userDao.create({
            username: data.username,
            password: hashedPassword,
            nickname: data.nickname || data.username,
            role: data.role,
        });
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
        };
        const token = this.generateToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        return {
            token,
            refreshToken,
            expiresIn: 7 * 24 * 60 * 60,
            user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                role: user.role,
            },
        };
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.verifyRefreshToken(refreshToken);
            const newToken = this.generateToken({
                userId: payload.userId,
                username: payload.username,
                role: payload.role,
            });
            const newRefreshToken = this.generateRefreshToken({
                userId: payload.userId,
                username: payload.username,
                role: payload.role,
            });
            return { token: newToken, refreshToken: newRefreshToken };
        }
        catch (error) {
            throw new error_middleware_1.AppError('Invalid refresh token', statusCode_1.BusinessCode.TOKEN_INVALID);
        }
    }
}
exports.default = new AuthService();
//# sourceMappingURL=Auth.service.js.map