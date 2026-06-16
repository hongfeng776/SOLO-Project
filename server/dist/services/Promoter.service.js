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
class PromoterService {
    async create(data) {
        const code = await this.generateCode();
        if (data.channelId) {
            const channel = await dao_1.channelDao.findById(data.channelId);
            if (!channel) {
                throw new error_middleware_1.AppError('渠道不存在', statusCode_1.BusinessCode.NOT_FOUND);
            }
            if (channel.status !== enum_1.ChannelStatus.ENABLED) {
                throw new error_middleware_1.AppError('渠道未启用，无法绑定', statusCode_1.BusinessCode.ERROR);
            }
        }
        const result = await dao_1.promoterDao.create({
            ...data,
            code,
            registerAt: data.registerAt || new Date(),
            status: enum_1.PromoterStatus.PENDING,
        });
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return result;
    }
    async generateCode() {
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const todayCount = await dao_1.promoterDao.getTodayCount();
        const seq = String(todayCount + 1).padStart(6, '0');
        const code = `P${dateStr}${seq}`;
        const exists = await dao_1.promoterDao.existsByCode(code);
        if (exists) {
            return this.generateCode();
        }
        return code;
    }
    async findById(id) {
        const cacheKey = `${cache_1.CacheKey.PROMOTER_DETAIL}${id}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await cache_1.default.set(cacheKey, promoter, cache_1.CacheTTL.MEDIUM);
        return promoter;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const cacheKey = `${cache_1.CacheKey.PROMOTER_LIST}${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const { rows, count } = await dao_1.promoterDao.findAllPaged(params);
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
    async findByChannelId(channelId) {
        return dao_1.promoterDao.findByChannelId(channelId);
    }
    async update(id, data) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (data.code && data.code !== promoter.code) {
            const exists = await dao_1.promoterDao.existsByCodeAndId(data.code, id);
            if (exists) {
                throw new error_middleware_1.AppError('推客编号已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        await dao_1.promoterDao.update(data, { where: { id } });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return dao_1.promoterDao.findById(id);
    }
    async delete(id) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.promoterDao.softDelete(id);
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async bulkDelete(ids) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要删除的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.promoterDao.bulkSoftDelete(ids);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async updateStatus(id, status) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const currentStatus = promoter.status;
        if (currentStatus === enum_1.PromoterStatus.PENDING && status !== enum_1.PromoterStatus.NORMAL && status !== enum_1.PromoterStatus.REJECTED) {
            throw new error_middleware_1.AppError('审核中的推客只能审核通过或拒绝', statusCode_1.BusinessCode.ERROR);
        }
        if (currentStatus === enum_1.PromoterStatus.CANCELLED) {
            throw new error_middleware_1.AppError('已注销的推客不能修改状态', statusCode_1.BusinessCode.ERROR);
        }
        if (currentStatus === enum_1.PromoterStatus.REJECTED && status !== enum_1.PromoterStatus.PENDING) {
            throw new error_middleware_1.AppError('已拒绝的推客只能重新提交审核', statusCode_1.BusinessCode.ERROR);
        }
        if (currentStatus === enum_1.PromoterStatus.FROZEN && status === enum_1.PromoterStatus.PENDING) {
            throw new error_middleware_1.AppError('冻结的推客不能设为审核中', statusCode_1.BusinessCode.ERROR);
        }
        await dao_1.promoterDao.update({ status: status }, { where: { id } });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async batchUpdateStatus(ids, status) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要操作的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        for (const id of ids) {
            const promoter = await dao_1.promoterDao.findById(id);
            if (promoter) {
                await dao_1.promoterDao.update({ status: status }, { where: { id } });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async approve(id, auditUserId) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (promoter.status !== enum_1.PromoterStatus.PENDING) {
            throw new error_middleware_1.AppError('当前推客状态不是审核中，无法审核通过', statusCode_1.BusinessCode.ERROR);
        }
        await dao_1.promoterDao.update({ status: enum_1.PromoterStatus.NORMAL }, { where: { id } });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async reject(id, auditUserId, reason) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (promoter.status !== enum_1.PromoterStatus.PENDING) {
            throw new error_middleware_1.AppError('当前推客状态不是审核中，无法拒绝', statusCode_1.BusinessCode.ERROR);
        }
        await dao_1.promoterDao.update({ status: enum_1.PromoterStatus.REJECTED, remark: reason }, { where: { id } });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async bindChannel(promoterId, channelId) {
        const promoter = await dao_1.promoterDao.findById(promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (promoter.status !== enum_1.PromoterStatus.NORMAL) {
            throw new error_middleware_1.AppError('只有正常状态的推客才能绑定渠道', statusCode_1.BusinessCode.ERROR);
        }
        if (promoter.channelId) {
            throw new error_middleware_1.AppError('推客已绑定渠道，请先解绑', statusCode_1.BusinessCode.ERROR);
        }
        const channel = await dao_1.channelDao.findById(channelId);
        if (!channel) {
            throw new error_middleware_1.AppError('渠道不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (channel.status !== enum_1.ChannelStatus.ENABLED) {
            throw new error_middleware_1.AppError('渠道未启用，无法绑定', statusCode_1.BusinessCode.ERROR);
        }
        await dao_1.promoterDao.update({ channelId }, { where: { id: promoterId } });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${promoterId}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
}
exports.default = new PromoterService();
//# sourceMappingURL=Promoter.service.js.map