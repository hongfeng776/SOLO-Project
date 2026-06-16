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
const error_middleware_1 = require("../middleware/error.middleware");
const statusCode_1 = require("../constants/statusCode");
const money_1 = __importDefault(require("../utils/money"));
const cache_1 = __importDefault(require("../utils/cache"));
class RiskControlService {
    constructor() {
        this.rules = [];
        this.initRules();
    }
    initRules() {
        this.rules = [
            {
                name: '单笔佣金金额上限',
                code: 'COMMISSION_AMOUNT_LIMIT',
                enabled: true,
                check: async (amount) => {
                    const limit = 50000;
                    const passed = money_1.default.isLess(amount, limit);
                    return { passed, rule: this.rules[0].code, message: passed ? '' : `单笔佣金金额不能超过 ¥${money_1.default.format(limit)}`, level: 'block' };
                },
            },
            {
                name: '推客日佣金频次限制',
                code: 'PROMOTER_DAILY_COMMISSION_LIMIT',
                enabled: true,
                check: async (promoterId) => {
                    const limit = 100;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const { Op } = await Promise.resolve().then(() => __importStar(require('sequelize')));
                    const count = await dao_1.commissionDao.count({ where: { promoterId, createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } } });
                    const passed = count < limit;
                    return { passed, rule: this.rules[1].code, message: passed ? '' : `推客当日佣金记录已达 ${count} 笔，超过限制 ${limit} 笔`, level: 'block' };
                },
            },
            {
                name: '提现金额与可用佣金校验',
                code: 'WITHDRAW_AMOUNT_CHECK',
                enabled: true,
                check: async (promoterId, amount) => {
                    const promoter = await dao_1.promoterDao.findById(promoterId);
                    if (!promoter)
                        return { passed: false, rule: this.rules[2].code, message: '推客不存在', level: 'block' };
                    const available = Number(promoter.availableCommission || 0);
                    const passed = money_1.default.isGreaterOrEqual(available, amount) && money_1.default.isGreater(amount, 0);
                    return { passed, rule: this.rules[2].code, message: passed ? '' : `提现金额超出可用佣金余额 ¥${money_1.default.format(available)}`, level: 'block' };
                },
            },
            {
                name: '异常高额订单预警',
                code: 'HIGH_AMOUNT_ORDER_WARN',
                enabled: true,
                check: async (amount) => {
                    const threshold = 100000;
                    const passed = money_1.default.isLess(amount, threshold);
                    return { passed, rule: this.rules[3].code, message: passed ? '' : `订单金额 ¥${money_1.default.format(amount)} 超过预警阈值 ¥${money_1.default.format(threshold)}`, level: 'warn' };
                },
            },
            {
                name: '短时间频繁操作检测',
                code: 'FREQUENT_OPERATION_CHECK',
                enabled: true,
                check: async (userId, action) => {
                    const key = `risk:freq:${userId}:${action}`;
                    const count = await cache_1.default.incr(key, 60);
                    const limit = 30;
                    const passed = count <= limit;
                    return { passed, rule: this.rules[4].code, message: passed ? '' : `操作过于频繁，1分钟内${action}操作已达 ${count} 次`, level: 'block' };
                },
            },
        ];
    }
    async checkRule(ruleCode, ...args) {
        const rule = this.rules.find(r => r.code === ruleCode);
        if (!rule || !rule.enabled) {
            return { passed: true, rule: ruleCode, message: '', level: 'warn' };
        }
        return rule.check(...args);
    }
    async checkAll(...args) {
        const results = [];
        for (const rule of this.rules) {
            if (rule.enabled) {
                const result = await rule.check(...args);
                if (!result.passed) {
                    results.push(result);
                }
            }
        }
        return results;
    }
    async checkCommission(amount, promoterId) {
        const amountCheck = await this.checkRule('COMMISSION_AMOUNT_LIMIT', amount);
        if (!amountCheck.passed && amountCheck.level === 'block') {
            throw new error_middleware_1.AppError(amountCheck.message, statusCode_1.BusinessCode.ERROR);
        }
        const freqCheck = await this.checkRule('PROMOTER_DAILY_COMMISSION_LIMIT', promoterId);
        if (!freqCheck.passed && freqCheck.level === 'block') {
            throw new error_middleware_1.AppError(freqCheck.message, statusCode_1.BusinessCode.ERROR);
        }
    }
    async checkWithdraw(promoterId, amount) {
        const check = await this.checkRule('WITHDRAW_AMOUNT_CHECK', promoterId, amount);
        if (!check.passed && check.level === 'block') {
            throw new error_middleware_1.AppError(check.message, statusCode_1.BusinessCode.ERROR);
        }
    }
    async checkOrder(amount) {
        const result = await this.checkRule('HIGH_AMOUNT_ORDER_WARN', amount);
        return result.passed ? [] : [result];
    }
    getRules() {
        return this.rules.map(r => ({ name: r.name, code: r.code, enabled: r.enabled }));
    }
}
exports.default = new RiskControlService();
//# sourceMappingURL=RiskControl.service.js.map