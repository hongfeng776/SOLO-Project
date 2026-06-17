"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class UserController {
    async create(req, res) {
        const data = req.body;
        const result = await services_1.userService.create(data);
        response_1.default.created(res, result, 'User created successfully');
    }
    async findById(req, res) {
        const { id } = req.params;
        const result = await services_1.userService.findById(id);
        response_1.default.success(res, result);
    }
    async findAll(req, res) {
        const page = parseInt(req.query.page || '1', 10);
        const pageSize = parseInt(req.query.pageSize || '10', 10);
        const params = { page, pageSize };
        const result = await services_1.userService.findAll(params);
        response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
    }
    async update(req, res) {
        const { id } = req.params;
        const data = req.body;
        const result = await services_1.userService.update(id, data);
        response_1.default.success(res, result, 'User updated successfully');
    }
    async delete(req, res) {
        const { id } = req.params;
        await services_1.userService.delete(id);
        response_1.default.success(res, null, 'User deleted successfully');
    }
    async getProfile(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            response_1.default.unauthorized(res, 'User not authenticated');
            return;
        }
        const result = await services_1.userService.findById(userId);
        response_1.default.success(res, result);
    }
    async updateProfile(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            response_1.default.unauthorized(res, 'User not authenticated');
            return;
        }
        const data = req.body;
        const result = await services_1.userService.update(userId, data);
        response_1.default.success(res, result, 'Profile updated successfully');
    }
    async createAdmin(req, res) {
        const currentUser = req.user;
        const data = req.body;
        const result = await services_1.userService.createAdmin(currentUser, data);
        response_1.default.created(res, result, '管理员账号创建成功');
    }
    async updateAdmin(req, res) {
        const currentUser = req.user;
        const { id } = req.params;
        const data = req.body;
        const result = await services_1.userService.updateAdmin(currentUser, id, data);
        response_1.default.success(res, result, '管理员账号更新成功');
    }
    async findAllAdvanced(req, res) {
        const page = parseInt(req.query.page || '1', 10);
        const pageSize = parseInt(req.query.pageSize || '10', 10);
        const params = {
            page,
            pageSize,
            role: req.query.role,
            status: req.query.status !== undefined ? parseInt(req.query.status, 10) : undefined,
            positionLevel: req.query.positionLevel !== undefined ? parseInt(req.query.positionLevel, 10) : undefined,
            permissionId: req.query.permissionId,
            keyword: req.query.keyword,
            startTime: req.query.startTime,
            endTime: req.query.endTime,
        };
        const result = await services_1.userService.findAllAdvanced(params);
        response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
    }
    async batchUpdateStatus(req, res) {
        const currentUser = req.user;
        const { ids, status } = req.body;
        const result = await services_1.userService.batchUpdateStatus(currentUser, ids, status);
        response_1.default.success(res, result, '批量状态更新完成');
    }
    async batchResetPermissions(req, res) {
        const currentUser = req.user;
        const { ids } = req.body;
        const result = await services_1.userService.batchResetPermissions(currentUser, ids);
        response_1.default.success(res, result, '批量权限重置完成');
    }
    async checkDeleteDependencies(req, res) {
        const { id } = req.params;
        const result = await services_1.userService.checkDeleteDependencies(id);
        response_1.default.success(res, result);
    }
    async deleteAdmin(req, res) {
        const currentUser = req.user;
        const { id } = req.params;
        await services_1.userService.deleteAdmin(currentUser, id);
        response_1.default.success(res, null, '管理员账号删除成功');
    }
    async getUserTraceInfo(req, res) {
        const { id } = req.params;
        const result = await services_1.userService.getUserTraceInfo(id);
        response_1.default.success(res, result);
    }
    async getPermissionMutualExclusionRules(req, res) {
        const result = services_1.userService.getPermissionMutualExclusionRules();
        response_1.default.success(res, result);
    }
}
exports.default = new UserController();
//# sourceMappingURL=User.controller.js.map