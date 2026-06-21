import redis from '../config/redis';
import Logger from './logger';

export enum CacheKey {
  CHANNEL_LIST = 'channel:list',
  CHANNEL_DETAIL = 'channel:detail:',
  PROMOTER_LIST = 'promoter:list',
  PROMOTER_DETAIL = 'promoter:detail:',
  ORDER_LIST = 'order:list',
  ORDER_DETAIL = 'order:detail:',
  COMMISSION_LIST = 'commission:list',
  COMMISSION_SUMMARY = 'commission:summary',
  MARKETING_LIST = 'marketing:list',
  MARKETING_DETAIL = 'marketing:detail:',
  MARKETING_TEMPLATE_LIST = 'marketing:template:list',
  MARKETING_TEMPLATE_DETAIL = 'marketing:template:detail:',
  MARKETING_REWARD_RULE = 'marketing:reward:rule:',
  MARKETING_ACTIVITY_LOG = 'marketing:activity:log:',
  MARKETING_SUBMIT_LOCK = 'marketing:submit:lock:',
  MARKETING_VALIDATION_RESULT = 'marketing:validation:',
  MARKETING_PREVIEW_SNAPSHOT = 'marketing:preview:',
  MARKETING_STATUS_CHANGE_LOG = 'marketing:status:change:',
  MARKETING_STATUS_LOCK = 'marketing:status:lock:',
  DASHBOARD_STATS = 'dashboard:stats',
  USER_INFO = 'user:info:',
  USER_LIST = 'user:list',
  USER_DETAIL = 'user:detail:',
  PERMISSION_LIST = 'permission:list:',
  PERMISSION_TREE = 'permission:tree',
  PERMISSION_DETAIL = 'permission:detail:',
  PERMISSION_MODULE = 'permission:module:',
  ROLE_LIST = 'role:list',
  ROLE_DETAIL = 'role:detail:',
  ROLE_PERMISSIONS = 'role:permissions:',
  ROLE_DELETION_LOGS = 'role:deletion-logs',
  CHANNEL_AUDIT_LIST = 'channel-audit:list',
  CHANNEL_AUDIT_DETAIL = 'channel-audit:detail:',
  PRODUCT_LIST = 'product:list',
  PRODUCT_DETAIL = 'product:detail:',
  PRODUCT_AUDIT_LIST = 'product-audit:list',
  PRODUCT_SUBMIT_LOCK = 'product:submit:lock:',
}

export enum CacheTTL {
  SHORT = 60,
  MEDIUM = 300,
  LONG = 1800,
  DAY = 86400,
}

class CacheUtils {
  public static async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      Logger.error('Cache get error:', error);
      return null;
    }
  }

  public static async set(key: string, value: any, ttl: number = CacheTTL.MEDIUM): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.set(key, serialized, 'EX', ttl);
    } catch (error) {
      Logger.error('Cache set error:', error);
    }
  }

  public static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      Logger.error('Cache del error:', error);
    }
  }

  public static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      Logger.error('Cache delPattern error:', error);
    }
  }

  public static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result > 0;
    } catch (error) {
      Logger.error('Cache exists error:', error);
      return false;
    }
  }

  public static async incr(key: string, ttl?: number): Promise<number> {
    try {
      const value = await redis.incr(key);
      if (ttl && value === 1) {
        await redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      Logger.error('Cache incr error:', error);
      return 0;
    }
  }

  public static async decr(key: string): Promise<number> {
    try {
      return await redis.decr(key);
    } catch (error) {
      Logger.error('Cache decr error:', error);
      return 0;
    }
  }

  public static async hGet<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const value = await redis.hget(key, field);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      Logger.error('Cache hGet error:', error);
      return null;
    }
  }

  public static async hSet(key: string, field: string, value: any): Promise<number> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      return await redis.hset(key, field, serialized);
    } catch (error) {
      Logger.error('Cache hSet error:', error);
      return 0;
    }
  }

  public static async hDel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await redis.hdel(key, ...fields);
    } catch (error) {
      Logger.error('Cache hDel error:', error);
      return 0;
    }
  }

  public static async hGetAll<T = any>(key: string): Promise<Record<string, T>> {
    try {
      const result = await redis.hgetall(key);
      const parsed: Record<string, T> = {};
      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value) as T;
        } catch {
          parsed[field] = value as unknown as T;
        }
      }
      return parsed;
    } catch (error) {
      Logger.error('Cache hGetAll error:', error);
      return {};
    }
  }
}

export default CacheUtils;
