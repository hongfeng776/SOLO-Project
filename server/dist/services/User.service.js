"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const Auth_service_1 = __importDefault(require("./Auth.service"));
const enum_1 = require("../constants/enum");
const lodash_1 = require("lodash");
const cache_1 = __importStar(require("../utils/cache"));
const permissionCheck_1 = require("../utils/permissionCheck");
const Notification_service_1 = __importDefault(require("./Notification.service"));
const uuid_1 = require("uuid");
const MAX_ACCOUNT_QUOTA = {
    [enum_1.UserRole.ADMIN]: 50,
    [enum_1.UserRole.USER]: 500,
    [enum_1.UserRole.GUEST]: 1000,
};
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
    async createAdmin(currentUser, data) {
        if (currentUser.role !== enum_1.UserRole.ADMIN) {
            throw new error_middleware_1.AppError('仅超级管理员可创建管理员账号', statusCode_1.BusinessCode.FORBIDDEN);
        }
        const roleCount = await dao_1.userDao.countByRole(data.role);
        const quota = MAX_ACCOUNT_QUOTA[data.role] || 100;
        if (roleCount >= quota) {
            throw new error_middleware_1.AppError(`${data.role} 角色账号数量已达上限 (${quota})`, statusCode_1.BusinessCode.ERROR);
        }
        if (data.positionLevel && currentUser.positionLevel && data.positionLevel <= currentUser.positionLevel) {
            throw new error_middleware_1.AppError('不能创建岗位层级高于或等于当前用户的账号', statusCode_1.BusinessCode.FORBIDDEN);
        }
        const idempotentKey = `user:create:${data.username}:${data.email}:${data.phone}`;
        const isDuplicate = await cache_1.default.get(idempotentKey);
        if (isDuplicate) {
            throw new error_middleware_1.AppError('请勿重复提交', statusCode_1.BusinessCode.ERROR);
        }
        await cache_1.default.set(idempotentKey, '1', cache_1.CacheTTL.SHORT);
        if (await dao_1.userDao.existsByUsername(data.username)) {
            throw new error_middleware_1.AppError('用户名已存在', statusCode_1.BusinessCode.USER_ALREADY_EXISTS);
        }
        if (await dao_1.userDao.existsByEmail(data.email)) {
            throw new error_middleware_1.AppError('邮箱已被使用', statusCode_1.BusinessCode.ERROR);
        }
        if (await dao_1.userDao.existsByPhone(data.phone)) {
            throw new error_middleware_1.AppError('手机号已被使用', statusCode_1.BusinessCode.ERROR);
        }
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(data.phone)) {
            throw new error_middleware_1.AppError('手机号格式不正确', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
        if (!emailRegex.test(data.email)) {
            throw new error_middleware_1.AppError('邮箱格式不正确', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const role = await dao_1.roleDao.findById(data.roleId);
        if (!role) {
            throw new error_middleware_1.AppError('所选角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        let finalPermissionIds = data.permissionIds || [];
        if (finalPermissionIds.length > 0) {
            const allPermissions = await dao_1.permissionDao.findAll();
            const conflicts = (0, permissionCheck_1.checkPermissionMutualExclusion)(finalPermissionIds, allPermissions);
            if (conflicts.length > 0) {
                throw new error_middleware_1.AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), statusCode_1.BusinessCode.ERROR);
            }
        }
        const hashedPassword = await Auth_service_1.default.hashPassword(data.password);
        const activationToken = (0, uuid_1.v4)();
        const user = await dao_1.userDao.create({
            username: data.username,
            password: hashedPassword,
            nickname: data.nickname,
            email: data.email,
            phone: data.phone,
            role: data.role,
            position: data.position,
            positionLevel: data.positionLevel,
            status: enum_1.UserStatus.ACTIVE,
            createdBy: currentUser.userId,
            createdByName: currentUser.username,
        });
        if (data.roleId && finalPermissionIds.length === 0) {
            await dao_1.roleDao.assignPermissions(data.roleId, finalPermissionIds);
        }
        await cache_1.default.set(`user:activation:${user.id}`, activationToken, cache_1.CacheTTL.LONG);
        const smsPromise = Notification_service_1.default.sendActivationSms(data.phone, data.username, activationToken);
        const emailPromise = Notification_service_1.default.sendActivationEmail(data.email, data.username, activationToken);
        await Promise.all([smsPromise, emailPromise]).catch(() => { });
        await cache_1.default.delPattern(`${cache_1.CacheKey.USER_LIST}*`);
        return this.sanitizeUser(user);
    }
    async updateAdmin(currentUser, id, data) {
        const user = await dao_1.userDao.findById(id);
        if (!user) {
            throw new error_middleware_1.AppError('用户不存在', statusCode_1.BusinessCode.USER_NOT_FOUND);
        }
        const isDisabled = user.status === enum_1.UserStatus.DISABLED;
        const hasPermissionChanges = data.permissionIds !== undefined || data.roleId !== undefined;
        if (isDisabled && hasPermissionChanges) {
            throw new error_middleware_1.AppError('禁用状态账号仅可编辑基础信息，无法修改权限配置', statusCode_1.BusinessCode.ERROR);
        }
        if (hasPermissionChanges && data.permissionIds && data.permissionIds.length > 0) {
            const allPermissions = await dao_1.permissionDao.findAll();
            const conflicts = (0, permissionCheck_1.checkPermissionMutualExclusion)(data.permissionIds, allPermissions);
            if (conflicts.length > 0) {
                throw new error_middleware_1.AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), statusCode_1.BusinessCode.ERROR);
            }
        }
        if (data.email && data.email !== user.email && await dao_1.userDao.existsByEmail(data.email, id)) {
            throw new error_middleware_1.AppError('邮箱已被其他账号使用', statusCode_1.BusinessCode.ERROR);
        }
        if (data.phone && data.phone !== user.phone && await dao_1.userDao.existsByPhone(data.phone, id)) {
            throw new error_middleware_1.AppError('手机号已被其他账号使用', statusCode_1.BusinessCode.ERROR);
        }
        const updateData = {};
        if (data.nickname !== undefined)
            updateData.nickname = data.nickname;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.position !== undefined)
            updateData.position = data.position;
        if (data.positionLevel !== undefined)
            updateData.positionLevel = data.positionLevel;
        await dao_1.userDao.update(updateData, { where: { id } });
        if (hasPermissionChanges) {
            await cache_1.default.del(`user:permissions:${id}`);
        }
        await cache_1.default.del(`${cache_1.CacheKey.USER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.USER_LIST}*`);
        const updatedUser = await dao_1.userDao.findById(id);
        return this.sanitizeUser(updatedUser);
    }
    async findAllAdvanced(params) {
        const { page, pageSize } = params;
        const cacheKey = `${cache_1.CacheKey.USER_LIST}:${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const { rows, count } = await dao_1.userDao.findAllPaged(params);
        const result = {
            list: rows.map(u => this.sanitizeUser(u)),
            total: count,
            page, pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async batchUpdateStatus(currentUser, ids, status) {
        const result = { success: [], failed: [] };
        for (const id of ids) {
            try {
                const user = await dao_1.userDao.findById(id);
                if (!user) {
                    result.failed.push({ id, reason: '用户不存在' });
                    continue;
                }
                if (user.role === enum_1.UserRole.ADMIN && id !== currentUser.userId) {
                    const isSuperAdmin = user.positionLevel === enum_1.AccountLevel.SUPER_ADMIN;
                    if (isSuperAdmin) {
                        result.failed.push({ id, reason: '超级管理员账号禁止批量操作' });
                        continue;
                    }
                }
                await dao_1.userDao.update({ status }, { where: { id } });
                await cache_1.default.del(`${cache_1.CacheKey.USER_DETAIL}${id}`);
                result.success.push(id);
            }
            catch (err) {
                result.failed.push({ id, reason: err.message || '操作失败' });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.USER_LIST}*`);
        return result;
    }
    async batchResetPermissions(currentUser, ids) {
        const result = { success: [], failed: [] };
        for (const id of ids) {
            try {
                const user = await dao_1.userDao.findById(id);
                if (!user) {
                    result.failed.push({ id, reason: '用户不存在' });
                    continue;
                }
                const isSuperAdmin = user.positionLevel === enum_1.AccountLevel.SUPER_ADMIN;
                if (isSuperAdmin) {
                    result.failed.push({ id, reason: '超级管理员账号禁止重置权限' });
                    continue;
                }
                await cache_1.default.del(`user:permissions:${id}`);
                result.success.push(id);
            }
            catch (err) {
                result.failed.push({ id, reason: err.message || '操作失败' });
            }
        }
        return result;
    }
    async checkDeleteDependencies(id) {
        const user = await dao_1.userDao.findById(id);
        if (!user) {
            throw new error_middleware_1.AppError('用户不存在', statusCode_1.BusinessCode.USER_NOT_FOUND);
        }
        if (user.positionLevel === enum_1.AccountLevel.SUPER_ADMIN) {
            throw new error_middleware_1.AppError('超级管理员账号不可删除', statusCode_1.BusinessCode.FORBIDDEN);
        }
        const dependencies = [];
        const pendingLogs = await dao_1.operationLogDao.findAllPaged({
            page: 1, pageSize: 1,
            userId: id,
            status: 0,
        }).catch(() => ({ count: 0 }));
        if (pendingLogs.count > 0) {
            dependencies.push({ type: 'unfinished_operations', count: pendingLogs.count, description: '存在未完结操作记录' });
        }
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentLogs = await dao_1.operationLogDao.findAllPaged({
            page: 1, pageSize: 1,
            userId: id,
            startTime: sevenDaysAgo.toISOString(),
        }).catch(() => ({ count: 0 }));
        if (recentLogs.count > 0) {
            dependencies.push({ type: 'recent_logs', count: recentLogs.count, description: `存在 ${recentLogs.count} 条最近7天的操作日志（归档中）` });
        }
        const roleCount = await dao_1.userDao.countByRole(user.role).catch(() => 0);
        if (roleCount > 0 && user.role !== enum_1.UserRole.USER) {
            dependencies.push({ type: 'role_reference', count: 1, description: `该账号关联角色配置: ${user.role}` });
        }
        return { hasDependencies: dependencies.length > 0, dependencies, canDelete: dependencies.length === 0 || dependencies.every(d => d.type === 'recent_logs') };
    }
    async deleteAdmin(currentUser, id) {
        const idempotentKey = `user:delete:${id}`;
        const isDuplicate = await cache_1.default.get(idempotentKey);
        if (isDuplicate) {
            throw new error_middleware_1.AppError('删除请求已提交，请勿重复操作', statusCode_1.BusinessCode.ERROR);
        }
        await cache_1.default.set(idempotentKey, '1', cache_1.CacheTTL.SHORT);
        const dependencyCheck = await this.checkDeleteDependencies(id);
        if (!dependencyCheck.canDelete) {
            throw new error_middleware_1.AppError(JSON.stringify({ message: '存在关联数据，无法删除', dependencies: dependencyCheck.dependencies }), statusCode_1.BusinessCode.ERROR);
        }
        const user = await dao_1.userDao.findById(id);
        if (!user) {
            throw new error_middleware_1.AppError('用户不存在', statusCode_1.BusinessCode.USER_NOT_FOUND);
        }
        await dao_1.userDao.destroy({ where: { id } });
        await cache_1.default.del(`user:permissions:${id}`);
        await cache_1.default.del(`${cache_1.CacheKey.USER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.USER_LIST}*`);
        await cache_1.default.del(idempotentKey);
    }
    async getUserTraceInfo(id) {
        const user = await dao_1.userDao.findById(id);
        if (!user) {
            throw new error_middleware_1.AppError('用户不存在', statusCode_1.BusinessCode.USER_NOT_FOUND);
        }
        const userData = user.toJSON ? user.toJSON() : user;
        return {
            id: userData.id,
            username: userData.username,
            createdBy: userData.createdBy,
            createdByName: userData.createdByName,
            createdAt: userData.createdAt,
            activatedAt: userData.activatedAt,
            lastLoginAt: userData.lastLoginAt,
            lastActiveAt: userData.lastActiveAt,
        };
    }
    getPermissionMutualExclusionRules() {
        return enum_1.PERMISSION_MUTUAL_EXCLUSIONS || [];
    }
    sanitizeUser(user) {
        const userData = user.toJSON ? user.toJSON() : user;
        return (0, lodash_1.omit)(userData, ['password', 'deletedAt']);
    }
}
exports.default = new UserService();
//# sourceMappingURL=User.service.js.map