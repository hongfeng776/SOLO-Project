"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
class PermissionService {
    async create(data) {
        const exists = await dao_1.permissionDao.existsByCode(data.code);
        if (exists) {
            throw new error_middleware_1.AppError('权限编码已存在', statusCode_1.BusinessCode.ERROR);
        }
        return dao_1.permissionDao.create(data);
    }
    async findById(id) {
        const permission = await dao_1.permissionDao.findById(id);
        if (!permission) {
            throw new error_middleware_1.AppError('权限不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return permission;
    }
    async findTree() {
        return dao_1.permissionDao.findTree();
    }
    async update(id, data) {
        const permission = await dao_1.permissionDao.findById(id);
        if (!permission) {
            throw new error_middleware_1.AppError('权限不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (data.code && data.code !== permission.code) {
            const exists = await dao_1.permissionDao.existsByCodeAndId(data.code, id);
            if (exists) {
                throw new error_middleware_1.AppError('权限编码已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        await dao_1.permissionDao.update(data, { where: { id } });
        return dao_1.permissionDao.findById(id);
    }
    async delete(id) {
        const permission = await dao_1.permissionDao.findById(id);
        if (!permission) {
            throw new error_middleware_1.AppError('权限不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.permissionDao.softDelete(id);
    }
    async bulkDelete(ids) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要删除的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.permissionDao.bulkSoftDelete(ids);
    }
    async updateStatus(id, status) {
        const permission = await dao_1.permissionDao.findById(id);
        if (!permission) {
            throw new error_middleware_1.AppError('权限不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.permissionDao.update({ status: status }, { where: { id } });
    }
}
exports.default = new PermissionService();
//# sourceMappingURL=Permission.service.js.map