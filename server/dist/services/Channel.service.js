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
const cache_1 = __importStar(require("../utils/cache"));
class ChannelService {
    async create(data) {
        const exists = await dao_1.channelDao.existsByCode(data.code);
        if (exists) {
            throw new error_middleware_1.AppError('渠道编码已存在', statusCode_1.BusinessCode.ERROR);
        }
        const result = await dao_1.channelDao.create(data);
        await cache_1.default.delPattern(`${cache_1.CacheKey.CHANNEL_LIST}*`);
        return result;
    }
    async findById(id) {
        const cacheKey = `${cache_1.CacheKey.CHANNEL_DETAIL}${id}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached) {
            return cached;
        }
        const channel = await dao_1.channelDao.findById(id);
        if (!channel) {
            throw new error_middleware_1.AppError('渠道不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await cache_1.default.set(cacheKey, channel, cache_1.CacheTTL.LONG);
        return channel;
    }
    async findAll(params) {
        const cacheKey = `${cache_1.CacheKey.CHANNEL_LIST}:${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached) {
            return cached;
        }
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.channelDao.findAllPaged(params);
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
        const channel = await dao_1.channelDao.findById(id);
        if (!channel) {
            throw new error_middleware_1.AppError('渠道不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (data.code && data.code !== channel.code) {
            const exists = await dao_1.channelDao.existsByCodeAndId(data.code, id);
            if (exists) {
                throw new error_middleware_1.AppError('渠道编码已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        await dao_1.channelDao.update(data, { where: { id } });
        const result = await dao_1.channelDao.findById(id);
        await cache_1.default.del(`${cache_1.CacheKey.CHANNEL_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.CHANNEL_LIST}*`);
        return result;
    }
    async delete(id) {
        const channel = await dao_1.channelDao.findById(id);
        if (!channel) {
            throw new error_middleware_1.AppError('渠道不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.channelDao.softDelete(id);
        await cache_1.default.del(`${cache_1.CacheKey.CHANNEL_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.CHANNEL_LIST}*`);
    }
    async bulkDelete(ids) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要删除的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.channelDao.bulkSoftDelete(ids);
        for (const id of ids) {
            await cache_1.default.del(`${cache_1.CacheKey.CHANNEL_DETAIL}${id}`);
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.CHANNEL_LIST}*`);
    }
    async updateStatus(id, status) {
        const channel = await dao_1.channelDao.findById(id);
        if (!channel) {
            throw new error_middleware_1.AppError('渠道不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.channelDao.update({ status: status }, { where: { id } });
        await cache_1.default.del(`${cache_1.CacheKey.CHANNEL_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.CHANNEL_LIST}*`);
    }
}
exports.default = new ChannelService();
//# sourceMappingURL=Channel.service.js.map