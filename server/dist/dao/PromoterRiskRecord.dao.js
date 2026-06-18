"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PromoterRiskRecord_model_1 = __importDefault(require("../models/PromoterRiskRecord.model"));
class PromoterRiskRecordDao {
    async create(data, options) {
        return PromoterRiskRecord_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return PromoterRiskRecord_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return PromoterRiskRecord_model_1.default.findOne(options);
    }
    async findAll(options) {
        return PromoterRiskRecord_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return PromoterRiskRecord_model_1.default.findAndCountAll(options);
    }
    async count(options) {
        return PromoterRiskRecord_model_1.default.count(options);
    }
    async findByPromoterId(promoterId) {
        return this.findAll({
            where: { promoterId },
            order: [['createdAt', 'DESC']],
        });
    }
    async findAllPaged(params) {
        const { page, pageSize, promoterId, riskLevel, riskType, isActive, startDate, endDate } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (promoterId) {
            where.promoterId = promoterId;
        }
        if (riskLevel) {
            where.riskLevel = riskLevel;
        }
        if (riskType) {
            where.riskType = riskType;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt[sequelize_1.Op.gte] = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt[sequelize_1.Op.lte] = end;
            }
        }
        return this.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['createdAt', 'DESC']],
        });
    }
    async update(id, data) {
        return PromoterRiskRecord_model_1.default.update(data, {
            where: { id },
            returning: true,
        });
    }
    async delete(id) {
        return PromoterRiskRecord_model_1.default.destroy({
            where: { id },
        });
    }
}
exports.default = new PromoterRiskRecordDao();
//# sourceMappingURL=PromoterRiskRecord.dao.js.map