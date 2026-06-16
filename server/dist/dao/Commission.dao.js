"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Commission_model_1 = __importDefault(require("../models/Commission.model"));
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
        const [totalResult, pendingResult, settledResult, withdrawnResult, deductedResult, countResult] = await Promise.all([
            Commission_model_1.default.findAll({
                attributes: [[(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 0), 'total']],
                where,
                raw: true,
            }),
            Commission_model_1.default.findAll({
                attributes: [[(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 0), 'total']],
                where: { ...where, status: 0 },
                raw: true,
            }),
            Commission_model_1.default.findAll({
                attributes: [[(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 0), 'total']],
                where: { ...where, status: 2 },
                raw: true,
            }),
            Commission_model_1.default.findAll({
                attributes: [[(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 0), 'total']],
                where: { ...where, status: 3 },
                raw: true,
            }),
            Commission_model_1.default.findAll({
                attributes: [[(0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 0), 'total']],
                where: { ...where, status: 4 },
                raw: true,
            }),
            this.count({ where }),
        ]);
        return {
            totalAmount: parseFloat(totalResult[0]?.total || 0),
            pendingAmount: parseFloat(pendingResult[0]?.total || 0),
            settledAmount: parseFloat(settledResult[0]?.total || 0),
            withdrawnAmount: parseFloat(withdrawnResult[0]?.total || 0),
            deductedAmount: parseFloat(deductedResult[0]?.total || 0),
            totalCount: countResult,
        };
    }
    async bulkUpdate(ids, data) {
        return this.update(data, { where: { id: { [sequelize_1.Op.in]: ids } } });
    }
}
exports.default = new CommissionDao();
//# sourceMappingURL=Commission.dao.js.map