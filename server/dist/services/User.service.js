"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const Auth_service_1 = __importDefault(require("./Auth.service"));
const lodash_1 = require("lodash");
class UserService {
    async create(data) {
        const exists = await dao_1.userDao.existsByUsername(data.username);
        if (exists) {
            throw new error_middleware_1.AppError('Username already exists', statusCode_1.BusinessCode.USER_ALREADY_EXISTS);
        }
        const hashedPassword = await Auth_service_1.default.hashPassword(data.password);
        const user = await dao_1.userDao.create({
            username: data.username,
            password: hashedPassword,
            nickname: data.nickname || data.username,
            role: data.role,
        });
        return this.sanitizeUser(user);
    }
    async findById(id) {
        const user = await dao_1.userDao.findById(id);
        if (!user) {
            throw new error_middleware_1.AppError('User not found', statusCode_1.BusinessCode.USER_NOT_FOUND);
        }
        return this.sanitizeUser(user);
    }
    async findByUsername(username) {
        const user = await dao_1.userDao.findByUsername(username);
        if (!user) {
            throw new error_middleware_1.AppError('User not found', statusCode_1.BusinessCode.USER_NOT_FOUND);
        }
        return this.sanitizeUser(user);
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const offset = (page - 1) * pageSize;
        const { rows, count } = await dao_1.userDao.findAndCountAll({
            offset,
            limit: pageSize,
            order: [['created_at', 'DESC']],
        });
        const sanitizedList = rows.map((user) => this.sanitizeUser(user));
        return {
            list: sanitizedList,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async update(id, data) {
        const user = await dao_1.userDao.findById(id);
        if (!user) {
            throw new error_middleware_1.AppError('User not found', statusCode_1.BusinessCode.USER_NOT_FOUND);
        }
        const updateData = {};
        if (data.nickname !== undefined) {
            updateData.nickname = data.nickname;
        }
        if (data.password !== undefined) {
            updateData.password = await Auth_service_1.default.hashPassword(data.password);
        }
        if (data.role !== undefined) {
            updateData.role = data.role;
        }
        if (data.status !== undefined) {
            updateData.status = data.status;
        }
        await dao_1.userDao.update(updateData, { where: { id } });
        const updatedUser = await dao_1.userDao.findById(id);
        return this.sanitizeUser(updatedUser);
    }
    async delete(id) {
        const user = await dao_1.userDao.findById(id);
        if (!user) {
            throw new error_middleware_1.AppError('User not found', statusCode_1.BusinessCode.USER_NOT_FOUND);
        }
        await dao_1.userDao.destroy({ where: { id } });
    }
    sanitizeUser(user) {
        const userData = user.toJSON ? user.toJSON() : user;
        return (0, lodash_1.omit)(userData, ['password', 'deletedAt']);
    }
}
exports.default = new UserService();
//# sourceMappingURL=User.service.js.map