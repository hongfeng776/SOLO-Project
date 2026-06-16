"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Order_model_1 = __importDefault(require("../models/Order.model"));
class OrderDao {
    async create(data, options) {
        return Order_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return Order_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return Order_model_1.default.findOne(options);
    }
    async findAll(options) {
        return Order_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return Order_model_1.default.findAndCountAll(options);
    }
    async update(data, options) {
        return Order_model_1.default.update(data, options);
    }
    async destroy(options) {
        return Order_model_1.default.destroy(options);
    }
    async count(options) {
        return Order_model_1.default.count(options);
    }
    async findById(id) {
        return this.findByPk(id);
    }
    async findAllPaged(params) {
        const { page, pageSize, keyword, orderNo, channelId, promoterId, status, startTime, endTime } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (keyword || orderNo) {
            const searchKeyword = keyword || orderNo;
            where.orderNo = { [sequelize_1.Op.like]: `%${searchKeyword}%` };
        }
        if (channelId) {
            where.channelId = channelId;
        }
        if (promoterId) {
            where.promoterId = promoterId;
        }
        if (status !== undefined) {
            where.status = status;
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
    async findByOrderNo(orderNo) {
        return this.findOne({ where: { orderNo } });
    }
    async existsByOrderNo(orderNo) {
        const count = await this.count({ where: { orderNo } });
        return count > 0;
    }
    async softDelete(id) {
        return this.destroy({ where: { id } });
    }
    async bulkSoftDelete(ids) {
        return this.destroy({ where: { id: { [sequelize_1.Op.in]: ids } } });
    }
    async bulkUpdate(ids, data) {
        return this.update(data, { where: { id: { [sequelize_1.Op.in]: ids } } });
    }
}
exports.default = new OrderDao();
//# sourceMappingURL=Order.dao.js.map