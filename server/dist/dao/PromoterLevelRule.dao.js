"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PromoterLevelRule_model_1 = __importDefault(require("../models/PromoterLevelRule.model"));
class PromoterLevelRuleDao {
    async create(data, options) {
        return PromoterLevelRule_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return PromoterLevelRule_model_1.default.findByPk(id, options);
    }
    async findByLevel(level, options) {
        return PromoterLevelRule_model_1.default.findOne({
            ...options,
            where: {
                ...(options?.where || {}),
                level,
            },
        });
    }
    async findAllActive(atDate, options) {
        const now = atDate || new Date();
        const where = {
            ...(options?.where || {}),
            [sequelize_1.Op.or]: [
                { effectiveFrom: { [sequelize_1.Op.lte]: now } },
                { effectiveFrom: null },
            ],
            [sequelize_1.Op.and]: [
                {
                    [sequelize_1.Op.or]: [
                        { effectiveTo: { [sequelize_1.Op.gte]: now } },
                        { effectiveTo: null },
                    ],
                },
            ],
        };
        return PromoterLevelRule_model_1.default.findAll({
            ...options,
            where,
            order: [['level', 'ASC']],
        });
    }
    async findAll(options) {
        return PromoterLevelRule_model_1.default.findAll({
            ...options,
            order: [['level', 'ASC']],
        });
    }
    async update(id, data) {
        return PromoterLevelRule_model_1.default.update(data, {
            where: { id },
            returning: true,
        });
    }
    async delete(id) {
        return PromoterLevelRule_model_1.default.destroy({
            where: { id },
        });
    }
}
exports.default = new PromoterLevelRuleDao();
//# sourceMappingURL=PromoterLevelRule.dao.js.map