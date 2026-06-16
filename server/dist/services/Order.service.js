"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const enum_1 = require("../constants/enum");
const CommissionEngine_service_1 = __importDefault(require("./CommissionEngine.service"));
const dao_2 = require("../dao");
const cache_1 = __importStar(require("../utils/cache"));
class OrderService {
    async create(data) {
        const orderNo = await this.generateOrderNo();
        const result = await dao_1.orderDao.create({
            ...data,
            orderNo,
            status: data.status ?? enum_1.OrderStatus.PENDING_PAY,
        });
        await cache_1.default.delPattern(`${cache_1.CacheKey.ORDER_LIST}*`);
        return result;
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
        const cacheKey = `${cache_1.CacheKey.ORDER_DETAIL}${id}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const order = await dao_1.orderDao.findById(id);
        if (!order) {
            throw new error_middleware_1.AppError('订单不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await cache_1.default.set(cacheKey, order, cache_1.CacheTTL.MEDIUM);
        return order;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const cacheKey = `${cache_1.CacheKey.ORDER_LIST}${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const { rows, count } = await dao_1.orderDao.findAllPaged(params);
        const result = {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async update(id, data) {
        const order = await dao_1.orderDao.findById(id);
        if (!order) {
            throw new error_middleware_1.AppError('订单不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (data.status !== undefined && data.status !== order.status) {
            const { status: _status, ...restData } = data;
            if (Object.keys(restData).length > 0) {
                await dao_1.orderDao.update(restData, { where: { id } });
            }
            await this.updateStatus(id, data.status);
            await this.clearOrderCache(id);
            return dao_1.orderDao.findById(id);
        }
        await dao_1.orderDao.update(data, { where: { id } });
        await this.clearOrderCache(id);
        return dao_1.orderDao.findById(id);
    }
    async updateStatus(id, status, userId) {
        const order = await dao_1.orderDao.findById(id);
        if (!order) {
            throw new error_middleware_1.AppError('订单不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const currentStatus = order.status;
        this.validateStatusTransition(currentStatus, status);
        const updateData = { status: status };
        switch (status) {
            case enum_1.OrderStatus.PAID:
                updateData.payTime = new Date();
                await dao_1.orderDao.update(updateData, { where: { id } });
                if (order.promoterId) {
                    await CommissionEngine_service_1.default.calculateFromOrder(id);
                }
                break;
            case enum_1.OrderStatus.COMPLETED:
                updateData.completeTime = new Date();
                await dao_1.orderDao.update(updateData, { where: { id } });
                const commissions = await dao_2.commissionDao.findByOrderId(id);
                for (const commission of commissions) {
                    if (commission.status === enum_1.CommissionStatus.PENDING) {
                        await dao_2.commissionDao.update({ status: enum_1.CommissionStatus.SETTLING }, { where: { id: commission.id } });
                    }
                }
                break;
            case enum_1.OrderStatus.CANCELLED:
                updateData.cancelTime = new Date();
                await dao_1.orderDao.update(updateData, { where: { id } });
                if (order.promoterId) {
                    await CommissionEngine_service_1.default.deductFromOrder(id, '订单取消，佣金扣减');
                }
                break;
            case enum_1.OrderStatus.REFUNDED:
                await dao_1.orderDao.update(updateData, { where: { id } });
                if (order.promoterId) {
                    await CommissionEngine_service_1.default.deductFromOrder(id, '订单退款，佣金扣减');
                }
                break;
            case enum_1.OrderStatus.SHIPPED:
                updateData.shipTime = new Date();
                await dao_1.orderDao.update(updateData, { where: { id } });
                break;
            default:
                await dao_1.orderDao.update(updateData, { where: { id } });
                break;
        }
        await this.clearOrderCache(id);
    }
    validateStatusTransition(current, target) {
        const validTransitions = {
            [enum_1.OrderStatus.PENDING_PAY]: [enum_1.OrderStatus.PAID, enum_1.OrderStatus.CANCELLED],
            [enum_1.OrderStatus.PAID]: [enum_1.OrderStatus.SHIPPED, enum_1.OrderStatus.CANCELLED, enum_1.OrderStatus.REFUNDING],
            [enum_1.OrderStatus.SHIPPED]: [enum_1.OrderStatus.COMPLETED, enum_1.OrderStatus.REFUNDING],
            [enum_1.OrderStatus.COMPLETED]: [enum_1.OrderStatus.REFUNDING],
            [enum_1.OrderStatus.REFUNDING]: [enum_1.OrderStatus.REFUNDED, enum_1.OrderStatus.COMPLETED],
            [enum_1.OrderStatus.CANCELLED]: [],
            [enum_1.OrderStatus.REFUNDED]: [],
        };
        const allowed = validTransitions[current];
        if (!allowed || !allowed.includes(target)) {
            const statusLabels = {
                [enum_1.OrderStatus.PENDING_PAY]: '待支付',
                [enum_1.OrderStatus.PAID]: '已支付',
                [enum_1.OrderStatus.SHIPPED]: '已发货',
                [enum_1.OrderStatus.COMPLETED]: '已完成',
                [enum_1.OrderStatus.CANCELLED]: '已取消',
                [enum_1.OrderStatus.REFUNDING]: '退款中',
                [enum_1.OrderStatus.REFUNDED]: '已退款',
            };
            throw new error_middleware_1.AppError(`订单状态不能从【${statusLabels[current]}】变更为【${statusLabels[target]}】`, statusCode_1.BusinessCode.ERROR);
        }
    }
    async delete(id) {
        const order = await dao_1.orderDao.findById(id);
        if (!order) {
            throw new error_middleware_1.AppError('订单不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.orderDao.softDelete(id);
        await this.clearOrderCache(id);
    }
    async bulkUpdate(ids, data) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要操作的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.orderDao.bulkUpdate(ids, data);
        await cache_1.default.delPattern(`${cache_1.CacheKey.ORDER_LIST}*`);
    }
    async export(params) {
        const { rows } = await dao_1.orderDao.findAllPaged({
            ...params,
            page: 1,
            pageSize: 99999,
        });
        return rows;
    }
    async clearOrderCache(id) {
        await cache_1.default.del(`${cache_1.CacheKey.ORDER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.ORDER_LIST}*`);
    }
}
exports.default = new OrderService();
//# sourceMappingURL=Order.service.js.map