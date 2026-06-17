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
const enum_1 = require("../constants/enum");
const cache_1 = __importStar(require("../utils/cache"));
const RolePermission_model_1 = __importDefault(require("../models/RolePermission.model"));
const SYSTEM_MENU_PATHS = [
    '/dashboard', '/permission', '/channel', '/promoter', '/order',
    '/commission', '/marketing', '/withdraw', '/log',
];
class PermissionService {
    async createPermission(currentUser, data) {
        if ((data.type === enum_1.PermissionType.MENU || data.type === 'directory') && data.path) {
            const pathExists = await dao_1.permissionDao.existsByPath(data.path);
            if (pathExists) {
                throw new error_middleware_1.AppError('访问路径已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        if (await dao_1.permissionDao.existsByCode(data.code)) {
            throw new error_middleware_1.AppError('权限编码已存在', statusCode_1.BusinessCode.ERROR);
        }
        let targetLevel = 1;
        if (data.parentId) {
            const parent = await dao_1.permissionDao.findById(data.parentId);
            if (!parent) {
                throw new error_middleware_1.AppError('上级菜单不存在', statusCode_1.BusinessCode.ERROR);
            }
            targetLevel = Number(parent.level || 1) + 1;
            if (targetLevel > 3) {
                throw new error_middleware_1.AppError('菜单最多支持三级，禁止越级创建', statusCode_1.BusinessCode.ERROR);
            }
        }
        const permission = await dao_1.permissionDao.create({
            ...data,
            level: targetLevel,
            status: enum_1.CommonStatus.ENABLED,
            createdBy: currentUser?.userId,
            createdByName: currentUser?.username,
            isSystem: false,
        });
        await this.clearPermissionCache();
        return permission;
    }
    async updatePermission(currentUser, id, data) {
        const perm = await dao_1.permissionDao.findById(id);
        if (!perm) {
            throw new error_middleware_1.AppError('菜单权限不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (perm.isSystem) {
            throw new error_middleware_1.AppError('系统内置菜单禁止修改', statusCode_1.BusinessCode.FORBIDDEN);
        }
        if (data.path && data.path !== perm.path) {
            const exists = await dao_1.permissionDao.existsByPath(data.path, id);
            if (exists)
                throw new error_middleware_1.AppError('访问路径已存在', statusCode_1.BusinessCode.ERROR);
        }
        if (data.code && data.code !== perm.code) {
            const exists = await dao_1.permissionDao.existsByCodeAndId(data.code, id);
            if (exists)
                throw new error_middleware_1.AppError('权限编码已存在', statusCode_1.BusinessCode.ERROR);
        }
        const updateData = { ...data };
        if (updateData.parentId !== undefined && updateData.parentId !== perm.parentId) {
            const parent = updateData.parentId ? await dao_1.permissionDao.findById(updateData.parentId) : null;
            updateData.level = parent ? Number(parent.level || 1) + 1 : 1;
        }
        await dao_1.permissionDao.update(updateData, { where: { id } });
        await this.clearPermissionCache();
        await cache_1.default.delPattern(`user:menus:*`);
        await cache_1.default.delPattern(`user:permissions:*`);
        return dao_1.permissionDao.findById(id);
    }
    async updateStatusBatch(currentUser, ids, status) {
        const result = { success: [], failed: [] };
        for (const id of ids) {
            try {
                const perm = await dao_1.permissionDao.findById(id);
                if (!perm) {
                    result.failed.push({ id, reason: '菜单不存在' });
                    continue;
                }
                if (perm.isSystem) {
                    result.failed.push({ id, reason: '系统内置菜单禁止修改状态' });
                    continue;
                }
                await dao_1.permissionDao.update({ status: status }, { where: { id } });
                result.success.push(id);
            }
            catch (err) {
                result.failed.push({ id, reason: err.message || '操作失败' });
            }
        }
        if (result.success.length > 0) {
            await this.clearPermissionCache();
            await cache_1.default.delPattern(`user:menus:*`);
        }
        return result;
    }
    async batchSort(currentUser, req) {
        const result = { success: [], failed: [] };
        for (const item of req.items) {
            try {
                const perm = await dao_1.permissionDao.findById(item.id);
                if (!perm) {
                    result.failed.push({ id: item.id, reason: '菜单不存在' });
                    continue;
                }
                if (perm.isSystem) {
                    result.failed.push({ id: item.id, reason: '系统内置菜单禁止调整' });
                    continue;
                }
                const updateData = { sort: item.sort };
                if (item.parentId !== undefined)
                    updateData.parentId = item.parentId;
                if (item.level !== undefined)
                    updateData.level = item.level;
                await dao_1.permissionDao.update(updateData, { where: { id: item.id } });
                result.success.push(item.id);
            }
            catch (err) {
                result.failed.push({ id: item.id, reason: err.message || '操作失败' });
            }
        }
        if (result.success.length > 0)
            await this.clearPermissionCache();
        return result;
    }
    async checkDeleteDependencies(id) {
        const perm = await dao_1.permissionDao.findById(id);
        if (!perm)
            throw new error_middleware_1.AppError('菜单不存在', statusCode_1.BusinessCode.NOT_FOUND);
        const dependencies = [];
        const hasChildren = await dao_1.permissionDao.hasChildren(id);
        if (hasChildren) {
            const children = await dao_1.permissionDao.getChildren(id);
            dependencies.push({ type: 'children', count: children.length, description: `存在 ${children.length} 个子菜单，需先删除子菜单` });
        }
        const roleCount = await dao_1.permissionDao.getBoundRoleCount(id);
        if (roleCount > 0) {
            dependencies.push({ type: 'role_binding', count: roleCount, description: `已绑定 ${roleCount} 个角色权限` });
        }
        const accessCount = await dao_1.permissionDao.getAccessLogCount(id, 30);
        if (accessCount > 0) {
            dependencies.push({ type: 'access_log', count: accessCount, description: `近30天存在 ${accessCount} 次访问记录` });
        }
        return {
            hasDependencies: dependencies.length > 0,
            dependencies,
            canDelete: dependencies.every(d => d.type === 'access_log'),
        };
    }
    async deletePermission(currentUser, id) {
        const idempotentKey = `perm:delete:${id}`;
        if (await cache_1.default.get(idempotentKey)) {
            throw new error_middleware_1.AppError('删除请求已提交，请勿重复操作', statusCode_1.BusinessCode.ERROR);
        }
        await cache_1.default.set(idempotentKey, '1', cache_1.CacheTTL.SHORT);
        try {
            const depCheck = await this.checkDeleteDependencies(id);
            if (!depCheck.canDelete) {
                throw new error_middleware_1.AppError(JSON.stringify({ message: '存在使用记录，禁止删除', dependencies: depCheck.dependencies }), statusCode_1.BusinessCode.ERROR);
            }
            const perm = await dao_1.permissionDao.findById(id);
            if (!perm)
                throw new error_middleware_1.AppError('菜单不存在', statusCode_1.BusinessCode.NOT_FOUND);
            if (perm.isSystem)
                throw new error_middleware_1.AppError('系统内置菜单禁止删除', statusCode_1.BusinessCode.FORBIDDEN);
            await dao_1.permissionDao.softDelete(id);
            await RolePermission_model_1.default.destroy({ where: { permissionId: id } });
            await this.clearPermissionCache();
            await cache_1.default.delPattern(`user:menus:*`);
            await cache_1.default.delPattern(`user:permissions:*`);
            await cache_1.default.del(idempotentKey);
        }
        catch (err) {
            await cache_1.default.del(idempotentKey);
            throw err;
        }
    }
    async findIdlePermissions(params) {
        const all = await this.findTree();
        const filterFn = (list) => {
            const result = [];
            for (const item of list) {
                const matched = item.status === enum_1.CommonStatus.DISABLED;
                const children = item.children ? filterFn(item.children) : [];
                if (matched || children.length > 0) {
                    result.push({ ...item, children: children.length ? children : undefined });
                }
            }
            return result;
        };
        return filterFn(all);
    }
    async findTree() {
        const cacheKey = cache_1.CacheKey.PERMISSION_TREE;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const tree = await dao_1.permissionDao.findTree();
        await cache_1.default.set(cacheKey, tree, cache_1.CacheTTL.SHORT);
        return tree;
    }
    async findById(id) {
        const cacheKey = `${cache_1.CacheKey.PERMISSION_DETAIL}${id}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const perm = await dao_1.permissionDao.findById(id);
        if (!perm)
            throw new error_middleware_1.AppError('权限不存在', statusCode_1.BusinessCode.NOT_FOUND);
        await cache_1.default.set(cacheKey, perm, cache_1.CacheTTL.MEDIUM);
        return perm;
    }
    async findByModule(module) {
        const cacheKey = `${cache_1.CacheKey.PERMISSION_MODULE}${module}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const result = await dao_1.permissionDao.findByModule(module);
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async clearPermissionCache() {
        await cache_1.default.del(cache_1.CacheKey.PERMISSION_TREE);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PERMISSION_DETAIL}*`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PERMISSION_MODULE}*`);
    }
}
exports.default = new PermissionService();
//# sourceMappingURL=Permission.service.js.map