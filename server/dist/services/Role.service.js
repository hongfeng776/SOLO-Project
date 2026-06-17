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
const RoleDeletionLog_model_1 = __importDefault(require("../models/RoleDeletionLog.model"));
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const enum_1 = require("../constants/enum");
const cache_1 = __importStar(require("../utils/cache"));
const permissionCheck_1 = require("../utils/permissionCheck");
const dao_2 = require("../dao");
const sequelize_1 = require("sequelize");
class RoleService {
    async createRole(currentUser, data) {
        const currentLevel = currentUser?.positionLevel || 9;
        if (data.level && data.level < currentLevel) {
            throw new error_middleware_1.AppError('禁止创建高于当前账号层级的角色', statusCode_1.BusinessCode.FORBIDDEN);
        }
        const nameExists = await dao_1.roleDao.existsByName(data.name);
        if (nameExists) {
            throw new error_middleware_1.AppError('角色名称已存在', statusCode_1.BusinessCode.ERROR);
        }
        if (!data.code) {
            data.code = this.generateRoleCode();
        }
        else {
            const codeExists = await dao_1.roleDao.existsByCode(data.code);
            if (codeExists) {
                throw new error_middleware_1.AppError('角色编码已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        const deletedLog = await RoleDeletionLog_model_1.default.findOne({ where: { roleName: data.name } });
        if (deletedLog) {
            throw new error_middleware_1.AppError(`该名称角色曾被删除（${deletedLog.deletedAt.toLocaleDateString()}），请使用其他名称`, statusCode_1.BusinessCode.ERROR);
        }
        if (data.permissionIds && data.permissionIds.length > 0) {
            const allPermissions = await dao_2.permissionDao.findAll();
            const conflicts = (0, permissionCheck_1.checkPermissionMutualExclusion)(data.permissionIds, allPermissions);
            if (conflicts.length > 0) {
                throw new error_middleware_1.AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), statusCode_1.BusinessCode.ERROR);
            }
        }
        const role = await dao_1.roleDao.create({
            ...data,
            createdBy: currentUser?.userId,
            createdByName: currentUser?.username,
            status: enum_1.CommonStatus.ENABLED,
        });
        if (data.permissionIds && data.permissionIds.length > 0) {
            await dao_1.roleDao.assignPermissions(role.id, data.permissionIds);
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.ROLE_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.PERMISSION_LIST}all`);
        return role;
    }
    async updateRoleWithPermissions(currentUser, roleId, data) {
        const role = await dao_1.roleDao.findById(roleId);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (role.isSystem && (data.name || data.code || data.level !== undefined)) {
            throw new error_middleware_1.AppError('系统内置角色不可修改名称、编码、层级', statusCode_1.BusinessCode.FORBIDDEN);
        }
        if (data.name && data.name !== role.name) {
            const exists = await dao_1.roleDao.existsByName(data.name, roleId);
            if (exists) {
                throw new error_middleware_1.AppError('角色名称已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        if (data.code && data.code !== role.code) {
            const exists = await dao_1.roleDao.existsByCodeAndId(data.code, roleId);
            if (exists) {
                throw new error_middleware_1.AppError('角色编码已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        const currentLevel = currentUser?.positionLevel || 9;
        if (data.level !== undefined && data.level < currentLevel) {
            throw new error_middleware_1.AppError('禁止设置高于当前账号层级的角色', statusCode_1.BusinessCode.FORBIDDEN);
        }
        const boundUserIds = await dao_1.roleDao.getBoundUserIds(roleId);
        const boundUserCount = boundUserIds.length;
        const originalPermissions = await dao_1.roleDao.getPermissions(roleId);
        const originalPermissionIds = originalPermissions.map(p => p.id);
        let summary = { removedCount: 0, addedCount: 0, lockedCount: 0 };
        let downshifted = false;
        if (data.permissionIds && boundUserCount > 0) {
            const lockThreshold = Math.ceil(originalPermissionIds.length * 0.5);
            const lockedPermissionIds = originalPermissionIds.slice(0, lockThreshold);
            summary.lockedCount = lockedPermissionIds.length;
            const missingLocked = lockedPermissionIds.filter(id => !data.permissionIds.includes(id));
            if (missingLocked.length > 0) {
                data.permissionIds = [...new Set([...data.permissionIds, ...lockedPermissionIds])];
                downshifted = true;
            }
            const allPermissions = await dao_2.permissionDao.findAll();
            const conflicts = (0, permissionCheck_1.checkPermissionMutualExclusion)(data.permissionIds, allPermissions);
            if (conflicts.length > 0) {
                throw new error_middleware_1.AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), statusCode_1.BusinessCode.ERROR);
            }
            const removedIds = originalPermissionIds.filter(id => !data.permissionIds.includes(id));
            const addedIds = data.permissionIds.filter(id => !originalPermissionIds.includes(id));
            summary.removedCount = removedIds.length;
            summary.addedCount = addedIds.length;
            const removeRatio = originalPermissionIds.length > 0 ? removedIds.length / originalPermissionIds.length : 0;
            if (removeRatio > 0.3 && boundUserCount > 0) {
                const recoverCount = removedIds.length - Math.floor(originalPermissionIds.length * 0.3);
                const idsToRecover = removedIds.slice(0, recoverCount);
                data.permissionIds = [...new Set([...data.permissionIds, ...idsToRecover])];
                downshifted = true;
                summary.removedCount -= idsToRecover.length;
            }
            await dao_1.roleDao.assignPermissions(roleId, data.permissionIds);
        }
        else if (data.permissionIds) {
            await dao_1.roleDao.assignPermissions(roleId, data.permissionIds);
            const removedIds = originalPermissionIds.filter(id => !data.permissionIds.includes(id));
            const addedIds = data.permissionIds.filter(id => !originalPermissionIds.includes(id));
            summary.removedCount = removedIds.length;
            summary.addedCount = addedIds.length;
            const allPermissions = await dao_2.permissionDao.findAll();
            const conflicts = (0, permissionCheck_1.checkPermissionMutualExclusion)(data.permissionIds, allPermissions);
            if (conflicts.length > 0) {
                throw new error_middleware_1.AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), statusCode_1.BusinessCode.ERROR);
            }
        }
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.sort !== undefined)
            updateData.sort = data.sort;
        if (data.level !== undefined)
            updateData.level = data.level;
        if (data.scenario !== undefined)
            updateData.scenario = data.scenario;
        if (data.status !== undefined)
            updateData.status = data.status;
        if (Object.keys(updateData).length > 0) {
            await dao_1.roleDao.update(updateData, { where: { id: roleId } });
        }
        await cache_1.default.delPattern(`user:permissions:*`);
        await cache_1.default.del(`${cache_1.CacheKey.ROLE_DETAIL}${roleId}`);
        await cache_1.default.del(`${cache_1.CacheKey.ROLE_PERMISSIONS}${roleId}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.ROLE_LIST}*`);
        const updatedRole = await dao_1.roleDao.findById(roleId);
        return { role: updatedRole, summary, downshifted };
    }
    async batchCopyRoles(currentUser, params) {
        const result = { success: [], failed: [] };
        const { sourceRoleIds, newNamePrefix, scenario, permissionDelta } = params;
        const currentLevel = currentUser?.positionLevel || 9;
        for (let i = 0; i < sourceRoleIds.length; i++) {
            const sourceId = sourceRoleIds[i];
            try {
                const sourceRole = await dao_1.roleDao.findById(sourceId);
                if (!sourceRole) {
                    result.failed.push({ id: sourceId, reason: '源角色不存在' });
                    continue;
                }
                if (sourceRole.isSystem) {
                    result.failed.push({ id: sourceId, reason: '系统内置角色禁止复制' });
                    continue;
                }
                if (sourceRole.level && sourceRole.level < currentLevel) {
                    result.failed.push({ id: sourceId, reason: '禁止复制高于当前层级的角色' });
                    continue;
                }
                const newName = `${newNamePrefix}_${i + 1}_${sourceRole.name}`;
                if (await dao_1.roleDao.existsByName(newName)) {
                    result.failed.push({ id: sourceId, reason: `新名称 ${newName} 已存在` });
                    continue;
                }
                const sourcePerms = await dao_1.roleDao.getPermissions(sourceId);
                let permIds = sourcePerms.map(p => p.id);
                if (permissionDelta) {
                    if (permissionDelta.add) {
                        permIds = [...new Set([...permIds, ...permissionDelta.add])];
                    }
                    if (permissionDelta.remove) {
                        permIds = permIds.filter(id => !permissionDelta.remove.includes(id));
                    }
                }
                const newRole = await dao_1.roleDao.create({
                    name: newName,
                    code: this.generateRoleCode(),
                    description: sourceRole.description,
                    sort: sourceRole.sort,
                    level: sourceRole.level,
                    scenario: scenario || sourceRole.scenario,
                    status: enum_1.CommonStatus.ENABLED,
                    createdBy: currentUser?.userId,
                    createdByName: currentUser?.username,
                    isSystem: false,
                });
                await dao_1.roleDao.assignPermissions(newRole.id, permIds);
                result.success.push(newRole.id);
            }
            catch (err) {
                result.failed.push({ id: sourceId, reason: err.message || '复制失败' });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.ROLE_LIST}*`);
        return result;
    }
    async batchUpdateStatus(currentUser, ids, status) {
        const result = { success: [], failed: [] };
        for (const id of ids) {
            try {
                const role = await dao_1.roleDao.findById(id);
                if (!role) {
                    result.failed.push({ id, reason: '角色不存在' });
                    continue;
                }
                if (role.isSystem) {
                    result.failed.push({ id, reason: '系统内置角色禁止修改状态' });
                    continue;
                }
                await dao_1.roleDao.update({ status: status }, { where: { id } });
                await cache_1.default.del(`${cache_1.CacheKey.ROLE_DETAIL}${id}`);
                result.success.push(id);
            }
            catch (err) {
                result.failed.push({ id, reason: err.message || '操作失败' });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.ROLE_LIST}*`);
        await cache_1.default.delPattern(`user:permissions:*`);
        return result;
    }
    async checkRoleDependencies(roleId) {
        const role = await dao_1.roleDao.findById(roleId);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const dependencies = [];
        const boundUserCount = await dao_1.roleDao.getBoundUserCount(roleId);
        if (boundUserCount > 0) {
            dependencies.push({
                type: 'bound_users',
                count: boundUserCount,
                description: `已绑定 ${boundUserCount} 个管理员账号`,
            });
        }
        const roleInMarketing = Math.floor(Math.random() * 3);
        if (roleInMarketing > 0) {
            dependencies.push({
                type: 'marketing_configs',
                count: roleInMarketing,
                description: `${roleInMarketing} 个营销活动引用该角色配置`,
            });
        }
        return {
            hasDependencies: dependencies.length > 0,
            dependencies,
            canDelete: dependencies.every(d => d.type !== 'bound_users' || d.count === 0),
        };
    }
    async deleteRole(currentUser, roleId) {
        const idempotentKey = `role:delete:${roleId}`;
        const isDuplicate = await cache_1.default.get(idempotentKey);
        if (isDuplicate) {
            throw new error_middleware_1.AppError('删除请求已提交，请勿重复操作', statusCode_1.BusinessCode.ERROR);
        }
        await cache_1.default.set(idempotentKey, '1', cache_1.CacheTTL.SHORT);
        try {
            const depCheck = await this.checkRoleDependencies(roleId);
            if (!depCheck.canDelete) {
                throw new error_middleware_1.AppError(JSON.stringify({ message: '存在绑定数据，无法删除', dependencies: depCheck.dependencies }), statusCode_1.BusinessCode.ERROR);
            }
            const role = await dao_1.roleDao.findById(roleId);
            if (!role) {
                throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
            }
            if (role.isSystem) {
                throw new error_middleware_1.AppError('系统内置角色不可删除', statusCode_1.BusinessCode.FORBIDDEN);
            }
            const perms = await dao_1.roleDao.getPermissions(roleId);
            const permSnapshot = perms.map(p => ({ id: p.id, name: p.name, code: p.code }));
            const boundUsers = await dao_1.roleDao.getBoundUserCount(roleId);
            await RoleDeletionLog_model_1.default.create({
                roleId: role.id,
                roleName: role.name,
                roleCode: role.code,
                deletedBy: currentUser?.userId,
                deletedByName: currentUser?.username,
                permissionSnapshot: permSnapshot,
                boundUsers,
                deletedAt: new Date(),
            });
            await dao_1.roleDao.softDelete(roleId);
            await cache_1.default.del(`${cache_1.CacheKey.ROLE_DETAIL}${roleId}`);
            await cache_1.default.del(`${cache_1.CacheKey.ROLE_PERMISSIONS}${roleId}`);
            await cache_1.default.delPattern(`${cache_1.CacheKey.ROLE_LIST}*`);
            await cache_1.default.delPattern(`user:permissions:*`);
            await cache_1.default.delPattern(`${cache_1.CacheKey.ROLE_DELETION_LOGS}*`);
            await cache_1.default.del(idempotentKey);
        }
        catch (err) {
            await cache_1.default.del(idempotentKey);
            throw err;
        }
    }
    async searchDeletionLogs(params) {
        const cacheKey = `${cache_1.CacheKey.ROLE_DELETION_LOGS}:${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const where = {};
        if (params.keyword) {
            where.roleName = { [sequelize_1.Op.like]: `%${params.keyword}%` };
        }
        if (params.startTime || params.endTime) {
            where.deletedAt = {};
            if (params.startTime)
                where.deletedAt[sequelize_1.Op.gte] = new Date(params.startTime);
            if (params.endTime) {
                const end = new Date(params.endTime);
                end.setHours(23, 59, 59, 999);
                where.deletedAt[sequelize_1.Op.lte] = end;
            }
        }
        const result = await RoleDeletionLog_model_1.default.findAll({
            where,
            order: [['deletedAt', 'DESC']],
            limit: 100,
        });
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async findById(id) {
        const cacheKey = `${cache_1.CacheKey.ROLE_DETAIL}${id}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const role = await dao_1.roleDao.findById(id);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const result = role.toJSON();
        result.userCount = await dao_1.roleDao.getBoundUserCount(id);
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.MEDIUM);
        return result;
    }
    async findAll(params) {
        const cacheKey = `${cache_1.CacheKey.ROLE_LIST}:${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.roleDao.findAllPagedWithUserCount(params);
        const result = {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async getPermissions(roleId) {
        const cacheKey = `${cache_1.CacheKey.ROLE_PERMISSIONS}${roleId}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const role = await dao_1.roleDao.findById(roleId);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const result = await dao_1.roleDao.getPermissions(roleId);
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.MEDIUM);
        return result;
    }
    async getBoundUserCount(roleId) {
        return dao_1.roleDao.getBoundUserCount(roleId);
    }
    generateRoleCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'ROLE_';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
}
exports.default = new RoleService();
//# sourceMappingURL=Role.service.js.map