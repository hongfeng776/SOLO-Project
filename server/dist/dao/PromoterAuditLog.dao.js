"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PromoterAuditLog_model_1 = __importDefault(require("../models/PromoterAuditLog.model"));
const enum_1 = require("../constants/enum");
class PromoterAuditLogDao {
    async create(data, options) {
        return PromoterAuditLog_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return PromoterAuditLog_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return PromoterAuditLog_model_1.default.findOne(options);
    }
    async findAll(options) {
        return PromoterAuditLog_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return PromoterAuditLog_model_1.default.findAndCountAll(options);
    }
    async findByPromoterId(promoterId) {
        return this.findAll({
            where: { promoterId },
            order: [['createdAt', 'ASC']],
        });
    }
    async findAllPaged(params) {
        const { page, pageSize, promoterId, operatorId, action, startDate, endDate } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (promoterId) {
            where.promoterId = promoterId;
        }
        if (operatorId) {
            where.operatorId = operatorId;
        }
        if (action) {
            where.action = action;
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
    async checkDuplicateApply(phone, idCard) {
        if (!phone && !idCard)
            return false;
        const promoterWhere = {};
        const orConditions = [];
        if (phone)
            orConditions.push({ phone });
        if (idCard)
            orConditions.push({ idCard });
        if (orConditions.length > 0) {
            promoterWhere[sequelize_1.Op.or] = orConditions;
        }
        const recentLogs = await this.findAll({
            where: {
                action: enum_1.AuditAction.SUBMIT,
            },
            include: [
                {
                    association: 'promoter',
                    where: promoterWhere,
                    required: true,
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: 10,
        });
        return recentLogs.length > 0;
    }
}
exports.default = new PromoterAuditLogDao();
//# sourceMappingURL=PromoterAuditLog.dao.js.map