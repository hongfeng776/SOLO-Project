"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.CacheKey = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = __importDefault(require("./logger"));
var CacheKey;
(function (CacheKey) {
    CacheKey["CHANNEL_LIST"] = "channel:list";
    CacheKey["CHANNEL_DETAIL"] = "channel:detail:";
    CacheKey["PROMOTER_LIST"] = "promoter:list";
    CacheKey["PROMOTER_DETAIL"] = "promoter:detail:";
    CacheKey["ORDER_LIST"] = "order:list";
    CacheKey["ORDER_DETAIL"] = "order:detail:";
    CacheKey["COMMISSION_LIST"] = "commission:list";
    CacheKey["COMMISSION_SUMMARY"] = "commission:summary";
    CacheKey["MARKETING_LIST"] = "marketing:list";
    CacheKey["MARKETING_DETAIL"] = "marketing:detail:";
    CacheKey["DASHBOARD_STATS"] = "dashboard:stats";
    CacheKey["USER_INFO"] = "user:info:";
    CacheKey["USER_LIST"] = "user:list";
    CacheKey["USER_DETAIL"] = "user:detail:";
    CacheKey["PERMISSION_LIST"] = "permission:list:";
    CacheKey["ROLE_LIST"] = "role:list";
    CacheKey["ROLE_DETAIL"] = "role:detail:";
    CacheKey["ROLE_PERMISSIONS"] = "role:permissions:";
    CacheKey["ROLE_DELETION_LOGS"] = "role:deletion-logs";
})(CacheKey || (exports.CacheKey = CacheKey = {}));
var CacheTTL;
(function (CacheTTL) {
    CacheTTL[CacheTTL["SHORT"] = 60] = "SHORT";
    CacheTTL[CacheTTL["MEDIUM"] = 300] = "MEDIUM";
    CacheTTL[CacheTTL["LONG"] = 1800] = "LONG";
    CacheTTL[CacheTTL["DAY"] = 86400] = "DAY";
})(CacheTTL || (exports.CacheTTL = CacheTTL = {}));
class CacheUtils {
    static async get(key) {
        try {
            const value = await redis_1.default.get(key);
            if (!value)
                return null;
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        catch (error) {
            logger_1.default.error('Cache get error:', error);
            return null;
        }
    }
    static async set(key, value, ttl = CacheTTL.MEDIUM) {
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            await redis_1.default.set(key, serialized, 'EX', ttl);
        }
        catch (error) {
            logger_1.default.error('Cache set error:', error);
        }
    }
    static async del(key) {
        try {
            await redis_1.default.del(key);
        }
        catch (error) {
            logger_1.default.error('Cache del error:', error);
        }
    }
    static async delPattern(pattern) {
        try {
            const keys = await redis_1.default.keys(pattern);
            if (keys.length > 0) {
                await redis_1.default.del(...keys);
            }
        }
        catch (error) {
            logger_1.default.error('Cache delPattern error:', error);
        }
    }
    static async exists(key) {
        try {
            const result = await redis_1.default.exists(key);
            return result > 0;
        }
        catch (error) {
            logger_1.default.error('Cache exists error:', error);
            return false;
        }
    }
    static async incr(key, ttl) {
        try {
            const value = await redis_1.default.incr(key);
            if (ttl && value === 1) {
                await redis_1.default.expire(key, ttl);
            }
            return value;
        }
        catch (error) {
            logger_1.default.error('Cache incr error:', error);
            return 0;
        }
    }
    static async decr(key) {
        try {
            return await redis_1.default.decr(key);
        }
        catch (error) {
            logger_1.default.error('Cache decr error:', error);
            return 0;
        }
    }
    static async hGet(key, field) {
        try {
            const value = await redis_1.default.hget(key, field);
            if (!value)
                return null;
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        catch (error) {
            logger_1.default.error('Cache hGet error:', error);
            return null;
        }
    }
    static async hSet(key, field, value) {
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            return await redis_1.default.hset(key, field, serialized);
        }
        catch (error) {
            logger_1.default.error('Cache hSet error:', error);
            return 0;
        }
    }
    static async hDel(key, ...fields) {
        try {
            return await redis_1.default.hdel(key, ...fields);
        }
        catch (error) {
            logger_1.default.error('Cache hDel error:', error);
            return 0;
        }
    }
    static async hGetAll(key) {
        try {
            const result = await redis_1.default.hgetall(key);
            const parsed = {};
            for (const [field, value] of Object.entries(result)) {
                try {
                    parsed[field] = JSON.parse(value);
                }
                catch {
                    parsed[field] = value;
                }
            }
            return parsed;
        }
        catch (error) {
            logger_1.default.error('Cache hGetAll error:', error);
            return {};
        }
    }
}
exports.default = CacheUtils;
//# sourceMappingURL=cache.js.map