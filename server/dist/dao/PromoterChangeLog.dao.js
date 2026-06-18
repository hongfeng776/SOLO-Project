"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PromoterChangeLog_model_1 = __importDefault(require("../models/PromoterChangeLog.model"));
class PromoterChangeLogDao {
    async create(data, options) {
        return PromoterChangeLog_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return PromoterChangeLog_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return PromoterChangeLog_model_1.default.findOne(options);
    }
    async findAll(options) {
        return PromoterChangeLog_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return PromoterChangeLog_model_1.default.findAndCountAll(options);
    }
    async findByPromoterId(promoterId) {
        return this.findAll({
            where: { promoterId },
            order: [['createdAt', 'DESC']],
        });
    }
    async findAllPaged(params) {
        const { page, pageSize, promoterId, operatorId, fieldName, changeType, startDate, endDate } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (promoterId) {
            where.promoterId = promoterId;
        }
        if (operatorId) {
            where.operatorId = operatorId;
        }
        if (fieldName) {
            where.fieldName = fieldName;
        }
        if (changeType) {
            where.changeType = changeType;
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
        return PromoterChangeLog_model_1.default.update(data, {
            where: { id },
            returning: true,
        });
    }
    async delete(id) {
        return PromoterChangeLog_model_1.default.destroy({
            where: { id },
        });
    }
}
exports.default = new PromoterChangeLogDao();
//# sourceMappingURL=PromoterChangeLog.dao.js.map