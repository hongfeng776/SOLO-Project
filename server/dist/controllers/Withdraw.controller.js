"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class WithdrawController {
    async create(req, res) {
        try {
            const data = req.body;
            const result = await services_1.withdrawService.create(data);
            response_1.default.created(res, result, '提现记录创建成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async apply(req, res) {
        try {
            const data = req.body;
            const result = await services_1.withdrawService.apply(data);
            response_1.default.created(res, result, '提现申请提交成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.withdrawService.findById(id);
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
            };
            const result = await services_1.withdrawService.findAll(params);
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
            const result = await services_1.withdrawService.update(id, data);
            response_1.default.success(res, result, '提现记录更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await services_1.withdrawService.delete(id);
            response_1.default.success(res, null, '提现记录删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async audit(req, res) {
        try {
            const { id } = req.params;
            const { approved, auditRemark } = req.body;
            const auditUserId = req.user?.userId;
            await services_1.withdrawService.audit(id, approved, auditRemark, auditUserId);
            response_1.default.success(res, null, approved ? '审核通过成功' : '审核拒绝成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async pay(req, res) {
        try {
            const { id } = req.params;
            const { payRemark } = req.body;
            await services_1.withdrawService.pay(id, payRemark);
            response_1.default.success(res, null, '打款成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new WithdrawController();
//# sourceMappingURL=Withdraw.controller.js.map