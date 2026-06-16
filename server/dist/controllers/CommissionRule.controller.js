"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommissionRule_service_1 = __importDefault(require("../services/CommissionRule.service"));
const response_1 = __importDefault(require("../utils/response"));
class CommissionRuleController {
    async create(req, res) {
        try {
            const data = req.body;
            const result = await CommissionRule_service_1.default.create(data);
            response_1.default.created(res, result, '佣金规则创建成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await CommissionRule_service_1.default.findById(id);
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
                page, pageSize,
                keyword: req.query.keyword,
                ruleType: req.query.ruleType,
                enabled: req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined,
            };
            const result = await CommissionRule_service_1.default.findAll(params);
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
            const result = await CommissionRule_service_1.default.update(id, data);
            response_1.default.success(res, result, '佣金规则更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await CommissionRule_service_1.default.delete(id);
            response_1.default.success(res, null, '佣金规则删除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async toggleEnabled(req, res) {
        try {
            const { id } = req.params;
            await CommissionRule_service_1.default.toggleEnabled(id);
            response_1.default.success(res, null, '状态切换成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new CommissionRuleController();
//# sourceMappingURL=CommissionRule.controller.js.map