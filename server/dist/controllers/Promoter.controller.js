"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class PromoterController {
    async create(req, res) {
        try {
            const data = req.body;
            const result = await services_1.promoterService.create(data);
            response_1.default.created(res, result, '推客创建成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.promoterService.findById(id);
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
                channelId: req.query.channelId,
                level: req.query.level,
                status: req.query.status ? parseInt(req.query.status, 10) : undefined,
            };
            const result = await services_1.promoterService.findAll(params);
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
            const result = await services_1.promoterService.update(id, data);
            response_1.default.success(res, result, '推客更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await services_1.promoterService.delete(id);
            response_1.default.success(res, null, '推客删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async bulkDelete(req, res) {
        try {
            const { ids } = req.body;
            await services_1.promoterService.bulkDelete(ids);
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
            await services_1.promoterService.updateStatus(id, status);
            response_1.default.success(res, null, '状态更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchUpdateStatus(req, res) {
        try {
            const { ids, status } = req.body;
            await services_1.promoterService.batchUpdateStatus(ids, status);
            response_1.default.success(res, null, '批量状态更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async approve(req, res) {
        try {
            const { id } = req.params;
            const auditUserId = req.user?.id || '';
            await services_1.promoterService.approve(id, auditUserId);
            response_1.default.success(res, null, '审核通过成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async reject(req, res) {
        try {
            const { id } = req.params;
            const auditUserId = req.user?.id || '';
            const { reason } = req.body;
            await services_1.promoterService.reject(id, auditUserId, reason);
            response_1.default.success(res, null, '审核拒绝成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new PromoterController();
//# sourceMappingURL=Promoter.controller.js.map