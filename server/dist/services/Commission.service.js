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
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const enum_1 = require("../constants/enum");
const cache_1 = __importStar(require("../utils/cache"));
class CommissionService {
    async create(data) {
        const result = await dao_1.commissionDao.create(data);
        await cache_1.default.delPattern(`${cache_1.CacheKey.COMMISSION_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.COMMISSION_SUMMARY}`);
        return result;
    }
    async findById(id) {
        const commission = await dao_1.commissionDao.findById(id);
        if (!commission) {
            throw new error_middleware_1.AppError('佣金记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return commission;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const cacheKey = `${cache_1.CacheKey.COMMISSION_LIST}${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const { rows, count } = await dao_1.commissionDao.findAllPaged(params);
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
        const commission = await dao_1.commissionDao.findById(id);
        if (!commission) {
            throw new error_middleware_1.AppError('佣金记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.commissionDao.update(data, { where: { id } });
        await cache_1.default.delPattern(`${cache_1.CacheKey.COMMISSION_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.COMMISSION_SUMMARY}`);
        return dao_1.commissionDao.findById(id);
    }
    async delete(id) {
        const commission = await dao_1.commissionDao.findById(id);
        if (!commission) {
            throw new error_middleware_1.AppError('佣金记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.commissionDao.softDelete(id);
        await cache_1.default.delPattern(`${cache_1.CacheKey.COMMISSION_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.COMMISSION_SUMMARY}`);
    }
    async summary(params) {
        const cacheKey = `${cache_1.CacheKey.COMMISSION_SUMMARY}${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const result = await dao_1.commissionDao.summary(params);
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async settle(ids) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要结算的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.commissionDao.bulkUpdate(ids, {
            status: enum_1.CommissionStatus.SETTLED,
            settleTime: new Date(),
        });
        await cache_1.default.delPattern(`${cache_1.CacheKey.COMMISSION_LIST}*`);
        await cache_1.default.del(`${cache_1.CacheKey.COMMISSION_SUMMARY}`);
    }
}
exports.default = new CommissionService();
//# sourceMappingURL=Commission.service.js.map