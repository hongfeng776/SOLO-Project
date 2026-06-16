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
const enum_1 = require("../constants/enum");
const money_1 = __importDefault(require("../utils/money"));
const cache_1 = __importStar(require("../utils/cache"));
const RiskControl_service_1 = __importDefault(require("./RiskControl.service"));
class CommissionEngineService {
    async calculateFromOrder(orderId) {
        const order = await dao_1.orderDao.findById(orderId);
        if (!order) {
            return [];
        }
        if (!order.promoterId) {
            return [];
        }
        const promoter = await dao_1.promoterDao.findById(order.promoterId);
        if (!promoter) {
            return [];
        }
        let rate = 0;
        let rateSource = 'default';
        if (order.channelId) {
            const channel = await dao_1.channelDao.findById(order.channelId);
            if (channel && channel.commissionRate) {
                rate = Number(channel.commissionRate);
                rateSource = 'channel';
            }
        }
        const payAmount = Number(order.payAmount || order.totalAmount || 0);
        const amount = money_1.default.multiply(payAmount, rate / 100);
        await RiskControl_service_1.default.checkCommission(amount, promoter.id);
        await dao_1.commissionDao.create({
            orderId: order.id,
            orderNo: order.orderNo,
            promoterId: promoter.id,
            channelId: order.channelId,
            type: 1,
            amount,
            rate,
            status: enum_1.CommissionStatus.PENDING,
            sourceType: 'order_direct',
            calcRule: {
                rateSource,
                formula: `payAmount * commissionRate / 100`,
                payAmount,
                commissionRate: rate,
            },
        });
        await dao_1.promoterDao.updateCommission(promoter.id, amount, amount);
        const results = [
            {
                promoterId: promoter.id,
                orderId: order.id,
                orderNo: order.orderNo,
                channelId: order.channelId || undefined,
                amount,
                rate,
                type: 1,
            },
        ];
        if (promoter.parentId) {
            const parentRate = money_1.default.multiply(rate / 100, 0.3) * 100;
            const parentCommission = money_1.default.multiply(payAmount, parentRate / 100);
            await dao_1.commissionDao.create({
                orderId: order.id,
                orderNo: order.orderNo,
                promoterId: promoter.parentId,
                channelId: order.channelId,
                type: 1,
                amount: parentCommission,
                rate: parentRate,
                status: enum_1.CommissionStatus.PENDING,
                remark: '间接佣金',
                sourceType: 'order_indirect',
                calcRule: {
                    rateSource: 'parent',
                    formula: `payAmount * (commissionRate * 0.3) / 100`,
                    payAmount,
                    commissionRate: rate,
                    indirectRate: parentRate,
                    indirectRatio: 0.3,
                },
            });
            await dao_1.promoterDao.updateCommission(promoter.parentId, parentCommission, parentCommission);
            results.push({
                promoterId: promoter.parentId,
                orderId: order.id,
                orderNo: order.orderNo,
                channelId: order.channelId || undefined,
                amount: parentCommission,
                rate: parentRate,
                type: 1,
                parentId: promoter.parentId,
                parentCommission,
                parentRate,
            });
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${promoter.id}`);
        if (promoter.parentId) {
            await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${promoter.parentId}`);
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.COMMISSION_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.COMMISSION_SUMMARY}`);
        return results;
    }
    async deductFromOrder(orderId, reason) {
        const commissions = await dao_1.commissionDao.findByOrderId(orderId);
        for (const commission of commissions) {
            if (commission.status === enum_1.CommissionStatus.PENDING || commission.status === enum_1.CommissionStatus.SETTLING) {
                await dao_1.commissionDao.update({ status: enum_1.CommissionStatus.DEDUCTED, remark: reason }, { where: { id: commission.id } });
                const deductAmount = Number(commission.amount);
                const promoter = await dao_1.promoterDao.findById(commission.promoterId);
                if (promoter) {
                    const available = Number(promoter.availableCommission || 0);
                    if (money_1.default.isGreaterOrEqual(available, deductAmount)) {
                        await dao_1.promoterDao.updateCommission(commission.promoterId, -deductAmount, -deductAmount);
                    }
                    else {
                        await dao_1.promoterDao.updateCommission(commission.promoterId, -deductAmount, -available);
                    }
                }
                await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${commission.promoterId}`);
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.COMMISSION_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.COMMISSION_SUMMARY}`);
    }
    async calculateMarketingBonus(orderId, marketingId) {
        const order = await dao_1.orderDao.findById(orderId);
        if (!order || !order.promoterId) {
            return null;
        }
        const { marketingDao } = await Promise.resolve().then(() => __importStar(require('../dao')));
        const marketing = await marketingDao.findById(marketingId);
        if (!marketing) {
            return null;
        }
        if (marketing.status !== 1) {
            return null;
        }
        const now = new Date();
        if (marketing.endTime && new Date(marketing.endTime) < now) {
            return null;
        }
        if (marketing.startTime && new Date(marketing.startTime) > now) {
            return null;
        }
        const bonusRate = marketing.maxCommissionRate ? Number(marketing.maxCommissionRate) : 0;
        if (bonusRate <= 0) {
            return null;
        }
        const payAmount = Number(order.payAmount || order.totalAmount || 0);
        const bonusAmount = money_1.default.multiply(payAmount, bonusRate / 100);
        await dao_1.commissionDao.create({
            orderId: order.id,
            orderNo: order.orderNo,
            promoterId: order.promoterId,
            channelId: order.channelId,
            type: 2,
            amount: bonusAmount,
            rate: bonusRate,
            status: enum_1.CommissionStatus.PENDING,
            remark: `营销活动加成: ${marketing.name}`,
            sourceType: 'marketing_bonus',
            calcRule: {
                rateSource: 'marketing',
                formula: `payAmount * bonusRate / 100`,
                payAmount,
                bonusRate,
                marketingId,
                marketingName: marketing.name,
            },
        });
        await dao_1.promoterDao.updateCommission(order.promoterId, bonusAmount, bonusAmount);
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${order.promoterId}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.COMMISSION_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.COMMISSION_SUMMARY}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.MARKETING_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.MARKETING_DETAIL}${marketingId}`);
        return {
            promoterId: order.promoterId,
            orderId: order.id,
            orderNo: order.orderNo,
            channelId: order.channelId || undefined,
            amount: bonusAmount,
            rate: bonusRate,
            type: 2,
        };
    }
}
exports.default = new CommissionEngineService();
//# sourceMappingURL=CommissionEngine.service.js.map