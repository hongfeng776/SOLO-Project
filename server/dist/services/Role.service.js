"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
class RoleService {
    async create(data) {
        const exists = await dao_1.roleDao.existsByCode(data.code);
        if (exists) {
            throw new error_middleware_1.AppError('角色编码已存在', statusCode_1.BusinessCode.ERROR);
        }
        return dao_1.roleDao.create(data);
    }
    async findById(id) {
        const role = await dao_1.roleDao.findById(id);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return role;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.roleDao.findAllPaged(params);
        return {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async update(id, data) {
        const role = await dao_1.roleDao.findById(id);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (data.code && data.code !== role.code) {
            const exists = await dao_1.roleDao.existsByCodeAndId(data.code, id);
            if (exists) {
                throw new error_middleware_1.AppError('角色编码已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        await dao_1.roleDao.update(data, { where: { id } });
        return dao_1.roleDao.findById(id);
    }
    async delete(id) {
        const role = await dao_1.roleDao.findById(id);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.roleDao.softDelete(id);
    }
    async bulkDelete(ids) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要删除的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.roleDao.bulkSoftDelete(ids);
    }
    async updateStatus(id, status) {
        const role = await dao_1.roleDao.findById(id);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.roleDao.update({ status: status }, { where: { id } });
    }
    async assignPermissions(roleId, permissionIds) {
        const role = await dao_1.roleDao.findById(roleId);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.roleDao.assignPermissions(roleId, permissionIds);
    }
    async getPermissions(roleId) {
        const role = await dao_1.roleDao.findById(roleId);
        if (!role) {
            throw new error_middleware_1.AppError('角色不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return dao_1.roleDao.getPermissions(roleId);
    }
}
exports.default = new RoleService();
//# sourceMappingURL=Role.service.js.map