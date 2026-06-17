"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class RoleController {
    async create(req, res) {
        try {
            const data = req.body;
            const result = await services_1.roleService.createRole(req.user, data);
            response_1.default.created(res, result, '角色创建成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async createRole(req, res) {
        try {
            const data = req.body;
            const result = await services_1.roleService.createRole(req.user, data);
            response_1.default.created(res, result, '角色创建成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.roleService.findById(id);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findAll(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '10', 10);
            const params = {
                page,
                pageSize,
                keyword: req.query.keyword,
                status: req.query.status ? parseInt(req.query.status, 10) : undefined,
            };
            const result = await services_1.roleService.findAll(params);
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const result = await services_1.roleService.updateRoleWithPermissions(req.user, id, data);
            response_1.default.success(res, result, '角色更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async updateRoleWithPermissions(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const result = await services_1.roleService.updateRoleWithPermissions(req.user, id, data);
            response_1.default.success(res, result, '角色更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await services_1.roleService.deleteRole(req.user, id);
            response_1.default.success(res, null, '角色删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async deleteRole(req, res) {
        try {
            const { id } = req.params;
            await services_1.roleService.deleteRole(req.user, id);
            response_1.default.success(res, null, '角色删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async bulkDelete(req, res) {
        try {
            const { ids } = req.body;
            if (!ids || ids.length === 0) {
                response_1.default.error(res, '请选择要删除的记录', 400);
                return;
            }
            for (const id of ids) {
                await services_1.roleService.deleteRole(req.user, id);
            }
            response_1.default.success(res, null, '批量删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const result = await services_1.roleService.batchUpdateStatus(req.user, [id], status);
            if (result.success.length > 0) {
                response_1.default.success(res, null, '状态更新成功');
            }
            else {
                response_1.default.error(res, result.failed[0]?.reason || '状态更新失败', 400);
            }
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async assignPermissions(req, res) {
        try {
            const { id } = req.params;
            const { permissionIds } = req.body;
            await services_1.roleService.updateRoleWithPermissions(req.user, id, { permissionIds });
            response_1.default.success(res, null, '权限分配成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async getPermissions(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.roleService.getPermissions(id);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchCopyRoles(req, res) {
        try {
            const params = req.body;
            const result = await services_1.roleService.batchCopyRoles(req.user, params);
            response_1.default.success(res, result, '批量复制完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchUpdateStatus(req, res) {
        try {
            const { ids, status } = req.body;
            const result = await services_1.roleService.batchUpdateStatus(req.user, ids, status);
            response_1.default.success(res, result, '批量状态更新完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async checkRoleDependencies(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.roleService.checkRoleDependencies(id);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async searchDeletionLogs(req, res) {
        try {
            const params = {
                keyword: req.query.keyword,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
            };
            const result = await services_1.roleService.searchDeletionLogs(params);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async getBoundUserCount(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.roleService.getBoundUserCount(id);
            response_1.default.success(res, { count: result });
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new RoleController();
//# sourceMappingURL=Role.controller.js.map