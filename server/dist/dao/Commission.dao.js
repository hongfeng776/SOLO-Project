"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Commission_model_1 = __importDefault(require("../models/Commission.model"));
const models_1 = require("../models");
const models_2 = require("../models");
class CommissionDao {
    async create(data, options) {
        return Commission_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return Commission_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return Commission_model_1.default.findOne(options);
    }
    async findAll(options) {
        return Commission_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return Commission_model_1.default.findAndCountAll(options);
    }
    async update(data, options) {
        return Commission_model_1.default.update(data, options);
    }
    async destroy(options) {
        return Commission_model_1.default.destroy(options);
    }
    async count(options) {
        return Commission_model_1.default.count(options);
    }
    async findById(id) {
        return this.findByPk(id);
    }
    async findAllPaged(params) {
        const { page, pageSize, promoterId, status, type, startTime, endTime } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (promoterId) {
            where.promoterId = promoterId;
        }
        if (status !== undefined) {
            where.status = status;
        }
        if (type !== undefined) {
            where.type = type;
        }
        if (startTime || endTime) {
            where.createdAt = {};
            if (startTime) {
                where.createdAt[sequelize_1.Op.gte] = new Date(startTime);
            }
            if (endTime) {
                const end = new Date(endTime);
                end.setHours(23, 59, 59, 999);
                where.createdAt[sequelize_1.Op.lte] = end;
            }
        }
        return this.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: models_1.Promoter,
                    as: 'promoter',
                    attributes: ['id', 'name', 'code'],
                    required: false,
                },
                {
                    model: models_2.Channel,
                    as: 'channel',
                    attributes: ['id', 'name'],
                    required: false,
                },
            ],
        });
    }
    async softDelete(id) {
        return this.destroy({ where: { id } });
    }
    async bulkSoftDelete(ids) {
        return this.destroy({ where: { id: { [sequelize_1.Op.in]: ids } } });
    }
    async summary(params) {
        const { promoterId, startTime, endTime } = params;
        const where = {};
        if (promoterId) {
            where.promoterId = promoterId;
        }
        if (startTime || endTime) {
            where.createdAt = {};
            if (startTime) {
                where.createdAt[sequelize_1.Op.gte] = new Date(startTime);
            }
            if (endTime) {
                const end = new Date(endTime);
                end.setHours(23, 59, 59, 999);
                where.createdAt[sequelize_1.Op.lte] = end;
            }
        }
        const result = await Commission_model_1.default.findAll({
            attributes: [
                [(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 0), 'totalAmount'],
                [(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.literal)('CASE WHEN status = 0 THEN amount ELSE 0 END')), 0), 'pendingAmount'],
                [(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.literal)('CASE WHEN status = 2 THEN amount ELSE 0 END')), 0), 'settledAmount'],
                [(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.literal)('CASE WHEN status = 3 THEN amount ELSE 0 END')), 0), 'withdrawnAmount'],
                [(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.literal)('CASE WHEN status = 4 THEN amount ELSE 0 END')), 0), 'deductedAmount'],
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'totalCount'],
            ],
            where,
            raw: true,
        });
        return {
            totalAmount: parseFloat(result[0]?.totalAmount || 0),
            pendingAmount: parseFloat(result[0]?.pendingAmount || 0),
            settledAmount: parseFloat(result[0]?.settledAmount || 0),
            withdrawnAmount: parseFloat(result[0]?.withdrawnAmount || 0),
            deductedAmount: parseFloat(result[0]?.deductedAmount || 0),
            totalCount: parseInt(result[0]?.totalCount || 0, 10),
        };
    }
    async findByOrderId(orderId) {
        return this.findAll({ where: { orderId } });
    }
    async findByOrderIds(orderIds) {
        return this.findAll({ where: { orderId: { [sequelize_1.Op.in]: orderIds } } });
    }
    async bulkUpdate(ids, data) {
        return this.update(data, { where: { id: { [sequelize_1.Op.in]: ids } } });
    }
}
exports.default = new CommissionDao();
//# sourceMappingURL=Commission.dao.js.map