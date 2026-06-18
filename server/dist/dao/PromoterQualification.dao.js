"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PromoterQualification_model_1 = __importDefault(require("../models/PromoterQualification.model"));
class PromoterQualificationDao {
    async create(data, options) {
        return PromoterQualification_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return PromoterQualification_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return PromoterQualification_model_1.default.findOne(options);
    }
    async findAll(options) {
        return PromoterQualification_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return PromoterQualification_model_1.default.findAndCountAll(options);
    }
    async findByPromoterId(promoterId) {
        return this.findAll({
            where: { promoterId },
            order: [['createdAt', 'DESC']],
        });
    }
    async findAllPaged(params) {
        const { page, pageSize, promoterId, type, verifyStatus, startDate, endDate } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (promoterId) {
            where.promoterId = promoterId;
        }
        if (type) {
            where.type = type;
        }
        if (verifyStatus !== undefined) {
            where.verifyStatus = verifyStatus;
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
        return PromoterQualification_model_1.default.update(data, {
            where: { id },
            returning: true,
        });
    }
    async delete(id) {
        return PromoterQualification_model_1.default.destroy({
            where: { id },
        });
    }
}
exports.default = new PromoterQualificationDao();
//# sourceMappingURL=PromoterQualification.dao.js.map