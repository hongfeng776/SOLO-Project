"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class MarketingController {
    async create(req, res) {
        try {
            const data = req.body;
            const result = await services_1.marketingService.create(data);
            response_1.default.created(res, result, '营销活动创建成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.marketingService.findById(id);
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
                type: req.query.type,
                status: req.query.status ? parseInt(req.query.status, 10) : undefined,
            };
            const result = await services_1.marketingService.findAll(params);
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
            const result = await services_1.marketingService.update(id, data);
            response_1.default.success(res, result, '营销活动更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await services_1.marketingService.delete(id);
            response_1.default.success(res, null, '营销活动删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async bulkDelete(req, res) {
        try {
            const { ids } = req.body;
            await services_1.marketingService.bulkDelete(ids);
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
            await services_1.marketingService.updateStatus(id, status);
            response_1.default.success(res, null, '状态更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchUpdateStatus(req, res) {
        try {
            const { ids, status } = req.body;
            await services_1.marketingService.batchUpdateStatus(ids, status);
            response_1.default.success(res, null, '批量状态更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async autoEnd(req, res) {
        try {
            const count = await services_1.marketingService.checkAndAutoEnd();
            response_1.default.success(res, { count }, `自动结束${count}个已过期活动`);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new MarketingController();
//# sourceMappingURL=Marketing.controller.js.map