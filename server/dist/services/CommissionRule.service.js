"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommissionRule_model_1 = __importDefault(require("../models/CommissionRule.model"));
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const sequelize_1 = require("sequelize");
class CommissionRuleService {
    async create(data) {
        const exists = await CommissionRule_model_1.default.count({ where: { code: data.code } });
        if (exists > 0) {
            throw new error_middleware_1.AppError('规则编码已存在', statusCode_1.BusinessCode.ERROR);
        }
        return CommissionRule_model_1.default.create(data);
    }
    async findById(id) {
        const rule = await CommissionRule_model_1.default.findByPk(id);
        if (!rule) {
            throw new error_middleware_1.AppError('佣金规则不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return rule;
    }
    async findAll(params) {
        const { page, pageSize, keyword, ruleType, enabled } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
        }
        if (ruleType)
            where.ruleType = ruleType;
        if (enabled !== undefined)
            where.enabled = enabled;
        const { rows, count } = await CommissionRule_model_1.default.findAndCountAll({ where, offset, limit: pageSize, order: [['priority', 'ASC'], ['createdAt', 'DESC']] });
        return { list: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
    }
    async update(id, data) {
        const rule = await CommissionRule_model_1.default.findByPk(id);
        if (!rule) {
            throw new error_middleware_1.AppError('佣金规则不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (data.code && data.code !== rule.code) {
            const exists = await CommissionRule_model_1.default.count({ where: { code: data.code, id: { [sequelize_1.Op.ne]: id } } });
            if (exists > 0) {
                throw new error_middleware_1.AppError('规则编码已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        await CommissionRule_model_1.default.update(data, { where: { id } });
        return CommissionRule_model_1.default.findByPk(id);
    }
    async delete(id) {
        const rule = await CommissionRule_model_1.default.findByPk(id);
        if (!rule) {
            throw new error_middleware_1.AppError('佣金规则不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await rule.destroy();
    }
    async toggleEnabled(id) {
        const rule = await CommissionRule_model_1.default.findByPk(id);
        if (!rule) {
            throw new error_middleware_1.AppError('佣金规则不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await CommissionRule_model_1.default.update({ enabled: !rule.enabled }, { where: { id } });
    }
    async findActiveRules(ruleType) {
        const now = new Date();
        const where = { enabled: true };
        if (ruleType)
            where.ruleType = ruleType;
        where[sequelize_1.Op.or] = [
            { effectiveStartTime: null, effectiveEndTime: null },
            { effectiveStartTime: { [sequelize_1.Op.lte]: now }, effectiveEndTime: { [sequelize_1.Op.gte]: now } },
            { effectiveStartTime: null, effectiveEndTime: { [sequelize_1.Op.gte]: now } },
            { effectiveStartTime: { [sequelize_1.Op.lte]: now }, effectiveEndTime: null },
        ];
        return CommissionRule_model_1.default.findAll({ where, order: [['priority', 'ASC']] });
    }
}
exports.default = new CommissionRuleService();
//# sourceMappingURL=CommissionRule.service.js.map