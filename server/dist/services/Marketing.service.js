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
const sequelize_1 = require("sequelize");
const cache_1 = __importStar(require("../utils/cache"));
class MarketingService {
    async create(data) {
        const exists = await dao_1.marketingDao.existsByCode(data.code);
        if (exists) {
            throw new error_middleware_1.AppError('活动编码已存在', statusCode_1.BusinessCode.ERROR);
        }
        if (data.startTime && data.endTime) {
            if (new Date(data.startTime) >= new Date(data.endTime)) {
                throw new error_middleware_1.AppError('活动开始时间必须早于结束时间', statusCode_1.BusinessCode.PARAM_ERROR);
            }
        }
        const result = await dao_1.marketingDao.create(data);
        await cache_1.default.delPattern(`${cache_1.CacheKey.MARKETING_LIST}*`);
        return result;
    }
    async findById(id) {
        const cacheKey = `${cache_1.CacheKey.MARKETING_DETAIL}${id}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const marketing = await dao_1.marketingDao.findById(id);
        if (!marketing) {
            throw new error_middleware_1.AppError('营销活动不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await cache_1.default.set(cacheKey, marketing, cache_1.CacheTTL.MEDIUM);
        return marketing;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const cacheKey = `${cache_1.CacheKey.MARKETING_LIST}${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const { rows, count } = await dao_1.marketingDao.findAllPaged(params);
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
        const marketing = await dao_1.marketingDao.findById(id);
        if (!marketing) {
            throw new error_middleware_1.AppError('营销活动不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (data.code && data.code !== marketing.code) {
            const exists = await dao_1.marketingDao.existsByCodeAndId(data.code, id);
            if (exists) {
                throw new error_middleware_1.AppError('活动编码已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        await dao_1.marketingDao.update(data, { where: { id } });
        await cache_1.default.del(`${cache_1.CacheKey.MARKETING_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.MARKETING_LIST}*`);
        return dao_1.marketingDao.findById(id);
    }
    async delete(id) {
        const marketing = await dao_1.marketingDao.findById(id);
        if (!marketing) {
            throw new error_middleware_1.AppError('营销活动不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.marketingDao.softDelete(id);
        await cache_1.default.del(`${cache_1.CacheKey.MARKETING_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.MARKETING_LIST}*`);
    }
    async bulkDelete(ids) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要删除的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.marketingDao.bulkSoftDelete(ids);
        await cache_1.default.delPattern(`${cache_1.CacheKey.MARKETING_LIST}*`);
    }
    async updateStatus(id, status) {
        const marketing = await dao_1.marketingDao.findById(id);
        if (!marketing) {
            throw new error_middleware_1.AppError('营销活动不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const currentStatus = marketing.status;
        if (currentStatus === enum_1.MarketingStatus.ONGOING && status === enum_1.MarketingStatus.ENDED) {
            if (marketing.endTime && new Date(marketing.endTime) > new Date()) {
                throw new error_middleware_1.AppError('活动尚未到期，不能手动结束', statusCode_1.BusinessCode.ERROR);
            }
        }
        if (currentStatus === enum_1.MarketingStatus.DRAFT && status === enum_1.MarketingStatus.ONGOING) {
            if (!marketing.startTime || !marketing.endTime) {
                throw new error_middleware_1.AppError('活动时间不完整，无法启动', statusCode_1.BusinessCode.ERROR);
            }
            if (new Date(marketing.startTime) >= new Date(marketing.endTime)) {
                throw new error_middleware_1.AppError('活动开始时间必须早于结束时间', statusCode_1.BusinessCode.ERROR);
            }
        }
        if (currentStatus === enum_1.MarketingStatus.ENDED || currentStatus === enum_1.MarketingStatus.CANCELLED) {
            throw new error_middleware_1.AppError('已结束或已取消的活动不能再修改状态', statusCode_1.BusinessCode.ERROR);
        }
        await dao_1.marketingDao.update({ status: status }, { where: { id } });
        await cache_1.default.del(`${cache_1.CacheKey.MARKETING_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.MARKETING_LIST}*`);
    }
    async batchUpdateStatus(ids, status) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要操作的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.marketingDao.update({ status: status }, { where: { id: { [sequelize_1.Op.in]: ids } } });
        for (const id of ids) {
            await cache_1.default.del(`${cache_1.CacheKey.MARKETING_DETAIL}${id}`);
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.MARKETING_LIST}*`);
    }
    async checkAndAutoEnd() {
        const now = new Date();
        const ongoingMarketings = await dao_1.marketingDao.findAll({
            where: {
                status: enum_1.MarketingStatus.ONGOING,
                endTime: { [sequelize_1.Op.lt]: now },
            },
        });
        let count = 0;
        for (const marketing of ongoingMarketings) {
            await dao_1.marketingDao.update({ status: enum_1.MarketingStatus.ENDED }, { where: { id: marketing.id } });
            await cache_1.default.del(`${cache_1.CacheKey.MARKETING_DETAIL}${marketing.id}`);
            count++;
        }
        if (count > 0) {
            await cache_1.default.delPattern(`${cache_1.CacheKey.MARKETING_LIST}*`);
        }
        return count;
    }
}
exports.default = new MarketingService();
//# sourceMappingURL=Marketing.service.js.map