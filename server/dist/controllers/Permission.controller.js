"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class PermissionController {
    async createPermission(req, res) {
        try {
            const data = req.body;
            const result = await services_1.permissionService.createPermission(req.user, data);
            response_1.default.created(res, result, '权限创建成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async updatePermission(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const result = await services_1.permissionService.updatePermission(req.user, id, data);
            response_1.default.success(res, result, '权限更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async updateStatusBatch(req, res) {
        try {
            const { ids, status } = req.body;
            const result = await services_1.permissionService.updateStatusBatch(req.user, ids, status);
            response_1.default.success(res, result, '批量更新状态成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchSort(req, res) {
        try {
            const result = await services_1.permissionService.batchSort(req.user, req.body);
            response_1.default.success(res, result, '批量排序成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async checkDeleteDependencies(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.permissionService.checkDeleteDependencies(id);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async deletePermission(req, res) {
        try {
            const { id } = req.params;
            await services_1.permissionService.deletePermission(req.user, id);
            response_1.default.success(res, null, '权限删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findIdlePermissions(req, res) {
        try {
            const params = {
                page: parseInt(req.query.page) || 1,
                pageSize: parseInt(req.query.pageSize) || 20,
                keyword: req.query.keyword,
                type: req.query.type,
                module: req.query.module,
                status: req.query.status !== undefined ? parseInt(req.query.status) : undefined,
                level: req.query.level !== undefined ? parseInt(req.query.level) : undefined,
                unusedDays: req.query.unusedDays !== undefined ? parseInt(req.query.unusedDays) : undefined,
            };
            const result = await services_1.permissionService.findIdlePermissions(params);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findByModule(req, res) {
        try {
            const { module } = req.params;
            const result = await services_1.permissionService.findByModule(module);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.permissionService.findById(id);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findTree(req, res) {
        try {
            const result = await services_1.permissionService.findTree();
            response_1.default.success(res, result);
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
                await services_1.permissionService.deletePermission(req.user, id);
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
            const result = await services_1.permissionService.updateStatusBatch(req.user, [id], status);
            if (result.failed.length > 0) {
                response_1.default.error(res, result.failed[0].reason, 400);
                return;
            }
            response_1.default.success(res, null, '状态更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new PermissionController();
//# sourceMappingURL=Permission.controller.js.map