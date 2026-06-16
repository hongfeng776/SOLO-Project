"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const enum_1 = require("../constants/enum");
class OrderService {
    async create(data) {
        const orderNo = await this.generateOrderNo();
        return dao_1.orderDao.create({
            ...data,
            orderNo,
            status: data.status ?? enum_1.OrderStatus.PENDING_PAY,
        });
    }
    async generateOrderNo() {
        const date = new Date();
        const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const orderNo = `O${timestamp}${random}`;
        const exists = await dao_1.orderDao.existsByOrderNo(orderNo);
        if (exists) {
            return this.generateOrderNo();
        }
        return orderNo;
    }
    async findById(id) {
        const order = await dao_1.orderDao.findById(id);
        if (!order) {
            throw new error_middleware_1.AppError('订单不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return order;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.orderDao.findAllPaged(params);
        return {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async update(id, data) {
        const order = await dao_1.orderDao.findById(id);
        if (!order) {
            throw new error_middleware_1.AppError('订单不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.orderDao.update(data, { where: { id } });
        return dao_1.orderDao.findById(id);
    }
    async delete(id) {
        const order = await dao_1.orderDao.findById(id);
        if (!order) {
            throw new error_middleware_1.AppError('订单不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.orderDao.softDelete(id);
    }
    async bulkUpdate(ids, data) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要操作的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.orderDao.bulkUpdate(ids, data);
    }
    async export(params) {
        const { rows } = await dao_1.orderDao.findAllPaged({
            ...params,
            page: 1,
            pageSize: 99999,
        });
        return rows;
    }
}
exports.default = new OrderService();
//# sourceMappingURL=Order.service.js.map