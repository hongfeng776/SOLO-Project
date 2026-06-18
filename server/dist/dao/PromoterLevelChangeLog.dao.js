"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PromoterLevelChangeLog_model_1 = __importDefault(require("../models/PromoterLevelChangeLog.model"));
class PromoterLevelChangeLogDao {
    async create(data, options) {
        return PromoterLevelChangeLog_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return PromoterLevelChangeLog_model_1.default.findByPk(id, options);
    }
    async findAllPaged(params) {
        const { page, pageSize, promoterId, changeSource, fromLevel, toLevel, anomalyFlagged, operatorId, startDate, endDate } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (promoterId) {
            where.promoterId = promoterId;
        }
        if (changeSource) {
            where.changeSource = changeSource;
        }
        if (fromLevel) {
            where.fromLevel = fromLevel;
        }
        if (toLevel) {
            where.toLevel = toLevel;
        }
        if (anomalyFlagged !== undefined) {
            where.anomalyFlagged = anomalyFlagged;
        }
        if (operatorId) {
            where.operatorId = operatorId;
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
        return PromoterLevelChangeLog_model_1.default.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['createdAt', 'DESC']],
        });
    }
    async findByPromoterId(promoterId, options) {
        return PromoterLevelChangeLog_model_1.default.findAll({
            ...options,
            where: {
                ...(options?.where || {}),
                promoterId,
            },
            order: [['createdAt', 'ASC']],
        });
    }
    async countByPromoterId(promoterId) {
        return PromoterLevelChangeLog_model_1.default.count({
            where: { promoterId },
        });
    }
    async findAnomalies(options) {
        return PromoterLevelChangeLog_model_1.default.findAll({
            ...options,
            where: {
                ...(options?.where || {}),
                anomalyFlagged: true,
            },
            order: [['createdAt', 'DESC']],
        });
    }
    async getIterationStats(options) {
        const result = await PromoterLevelChangeLog_model_1.default.findAll({
            ...options,
            attributes: [
                'promoterId',
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'totalChanges'],
                [(0, sequelize_1.fn)('MAX', (0, sequelize_1.col)('created_at')), 'lastChangeAt'],
            ],
            group: ['promoterId'],
            raw: true,
        });
        return result.map((row) => ({
            promoterId: row.promoterId,
            totalChanges: Number(row.totalChanges) || 0,
            lastChangeAt: row.lastChangeAt ? new Date(row.lastChangeAt) : null,
        }));
    }
}
exports.default = new PromoterLevelChangeLogDao();
//# sourceMappingURL=PromoterLevelChangeLog.dao.js.map