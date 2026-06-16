"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const CommissionEngine_service_1 = __importDefault(require("../services/CommissionEngine.service"));
const response_1 = __importDefault(require("../utils/response"));
class CommissionController {
    async create(req, res) {
        try {
            const data = req.body;
            const result = await services_1.commissionService.create(data);
            response_1.default.created(res, result, '佣金记录创建成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.commissionService.findById(id);
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
                promoterId: req.query.promoterId,
                status: req.query.status ? parseInt(req.query.status, 10) : undefined,
                type: req.query.type ? parseInt(req.query.type, 10) : undefined,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
            };
            const result = await services_1.commissionService.findAll(params);
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
            const result = await services_1.commissionService.update(id, data);
            response_1.default.success(res, result, '佣金记录更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await services_1.commissionService.delete(id);
            response_1.default.success(res, null, '佣金记录删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async summary(req, res) {
        try {
            const params = {
                promoterId: req.query.promoterId,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
            };
            const result = await services_1.commissionService.summary(params);
            response_1.default.success(res, result, '汇总统计成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async settle(req, res) {
        try {
            const { ids } = req.body;
            await services_1.commissionService.settle(ids);
            response_1.default.success(res, null, '批量结算成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async deduct(req, res) {
        try {
            const { orderId, reason } = req.body;
            await CommissionEngine_service_1.default.deductFromOrder(orderId, reason);
            response_1.default.success(res, null, '佣金扣减成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new CommissionController();
//# sourceMappingURL=Commission.controller.js.map