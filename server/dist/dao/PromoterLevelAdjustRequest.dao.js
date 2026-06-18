"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PromoterLevelAdjustRequest_model_1 = __importDefault(require("../models/PromoterLevelAdjustRequest.model"));
const enum_1 = require("../constants/enum");
class PromoterLevelAdjustRequestDao {
    async create(data, options) {
        return PromoterLevelAdjustRequest_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return PromoterLevelAdjustRequest_model_1.default.findByPk(id, options);
    }
    async findAllPaged(params) {
        const { page, pageSize, promoterId, applicantId, fromLevel, toLevel, approveStatus, startDate, endDate } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (promoterId) {
            where.promoterId = promoterId;
        }
        if (applicantId) {
            where.applicantId = applicantId;
        }
        if (fromLevel) {
            where.fromLevel = fromLevel;
        }
        if (toLevel) {
            where.toLevel = toLevel;
        }
        if (approveStatus !== undefined) {
            where.approveStatus = approveStatus;
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
        return PromoterLevelAdjustRequest_model_1.default.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['createdAt', 'DESC']],
        });
    }
    async findByPromoterId(promoterId, options) {
        return PromoterLevelAdjustRequest_model_1.default.findAll({
            ...options,
            where: {
                ...(options?.where || {}),
                promoterId,
            },
            order: [['createdAt', 'DESC']],
        });
    }
    async findPendingByApproverId(_approverId, options) {
        return PromoterLevelAdjustRequest_model_1.default.findAll({
            ...options,
            where: {
                ...(options?.where || {}),
                approveStatus: enum_1.ManualLevelAdjustStatus.PENDING,
            },
            order: [['createdAt', 'ASC']],
        });
    }
    async update(id, data) {
        return PromoterLevelAdjustRequest_model_1.default.update(data, {
            where: { id },
            returning: true,
        });
    }
    async delete(id) {
        return PromoterLevelAdjustRequest_model_1.default.destroy({
            where: { id },
        });
    }
}
exports.default = new PromoterLevelAdjustRequestDao();
//# sourceMappingURL=PromoterLevelAdjustRequest.dao.js.map