export declare enum CacheKey {
    CHANNEL_LIST = "channel:list",
    CHANNEL_DETAIL = "channel:detail:",
    PROMOTER_LIST = "promoter:list",
    PROMOTER_DETAIL = "promoter:detail:",
    DASHBOARD_STATS = "dashboard:stats",
    USER_INFO = "user:info:",
    PERMISSION_LIST = "permission:list:"
}
export declare enum CacheTTL {
    SHORT = 60,
    MEDIUM = 300,
    LONG = 1800,
    DAY = 86400
}
declare class CacheUtils {
    static get<T = any>(key: string): Promise<T | null>;
    static set(key: string, value: any, ttl?: number): Promise<void>;
    static del(key: string): Promise<void>;
    static delPattern(pattern: string): Promise<void>;
    static exists(key: string): Promise<boolean>;
    static incr(key: string, ttl?: number): Promise<number>;
    static decr(key: string): Promise<number>;
    static hGet<T = any>(key: string, field: string): Promise<T | null>;
    static hSet(key: string, field: string, value: any): Promise<number>;
    static hDel(key: string, ...fields: string[]): Promise<number>;
    static hGetAll<T = any>(key: string): Promise<Record<string, T>>;
}
export default CacheUtils;
//# sourceMappingURL=cache.d.ts.map