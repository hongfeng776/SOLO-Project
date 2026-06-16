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
}
exports.default = new UserController();
//# sourceMappingURL=User.controller.js.map