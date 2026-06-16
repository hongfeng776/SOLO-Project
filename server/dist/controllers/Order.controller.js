"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class OrderController {
    async create(req, res) {
        try {
            const data = req.body;
            const result = await services_1.orderService.create(data);
            response_1.default.created(res, result, '订单创建成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.orderService.findById(id);
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
                orderNo: req.query.orderNo,
                channelId: req.query.channelId,
                promoterId: req.query.promoterId,
                status: req.query.status ? parseInt(req.query.status, 10) : undefined,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
            };
            const result = await services_1.orderService.findAll(params);
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
            const result = await services_1.orderService.update(id, data);
            response_1.default.success(res, result, '订单更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await services_1.orderService.delete(id);
            response_1.default.success(res, null, '订单删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async bulkUpdate(req, res) {
        try {
            const { ids, data } = req.body;
            await services_1.orderService.bulkUpdate(ids, data);
            response_1.default.success(res, null, '批量更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async export(req, res) {
        try {
            const params = {
                page: 1,
                pageSize: 99999,
                keyword: req.query.keyword,
                orderNo: req.query.orderNo,
                channelId: req.query.channelId,
                promoterId: req.query.promoterId,
                status: req.query.status ? parseInt(req.query.status, 10) : undefined,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
            };
            const result = await services_1.orderService.export(params);
            response_1.default.success(res, result, '导出成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user?.id;
            await services_1.orderService.updateStatus(id, status, userId);
            response_1.default.success(res, null, '订单状态更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new OrderController();
//# sourceMappingURL=Order.controller.js.map