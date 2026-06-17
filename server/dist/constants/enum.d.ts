export declare enum UserRole {
    ADMIN = "admin",
    USER = "user",
    GUEST = "guest"
}
export declare enum UserStatus {
    ACTIVE = 1,
    DISABLED = 0,
    DELETED = -1
}
export declare enum CommonStatus {
    ENABLED = 1,
    DISABLED = 0
}
export declare enum ChannelStatus {
    ENABLED = 1,
    DISABLED = 0
}
export declare enum ChannelType {
    WECHAT = "wechat",
    DOUYIN = "douyin",
    KUAISHOU = "kuaishou",
    XIAOHONGSHU = "xiaohongshu",
    WEIBO = "weibo",
    OTHER = "other"
}
export declare enum PromoterLevel {
    L1 = "L1",
    L2 = "L2",
    L3 = "L3",
    L4 = "L4",
    L5 = "L5"
}
export declare enum PromoterStatus {
    NORMAL = 1,
    PENDING = 2,
    FROZEN = 0,
    CANCELLED = -1,
    REJECTED = -2
}
export declare enum OrderStatus {
    PENDING_PAY = 0,
    PAID = 1,
    SHIPPED = 2,
    COMPLETED = 3,
    CANCELLED = 4,
    REFUNDING = 5,
    REFUNDED = 6
}
export declare enum CommissionStatus {
    PENDING = 0,
    SETTLING = 1,
    SETTLED = 2,
    WITHDRAWN = 3,
    DEDUCTED = 4
}
export declare enum MarketingStatus {
    DRAFT = 0,
    ONGOING = 1,
    ENDED = 2,
    CANCELLED = 3
}
export declare enum MarketingType {
    COUPON = "coupon",
    DISCOUNT = "discount",
    CASHBACK = "cashback",
    REBATE = "rebate",
    BONUS = "bonus"
}
export declare enum WithdrawStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
    PAID = 3,
    FAILED = 4
}
export declare enum PermissionType {
    MENU = "menu",
    BUTTON = "button",
    API = "api"
}
export declare enum PermissionModule {
    SYSTEM = "system",
    CHANNEL = "channel",
    PROMOTER = "promoter",
    ORDER = "order",
    COMMISSION = "commission",
    MARKETING = "marketing",
    WITHDRAW = "withdraw",
    LOG = "log",
    DASHBOARD = "dashboard"
}
export declare const PERMISSION_MODULE_LABELS: Record<string, string>;
export declare enum AccountLevel {
    SUPER_ADMIN = 1,
    ADMIN = 3,
    MANAGER = 5,
    OPERATOR = 7,
    VIEWER = 9
}
export interface PermissionMutualExclusion {
    codes: [string, string];
    reason: string;
}
export declare const PERMISSION_MUTUAL_EXCLUSIONS: PermissionMutualExclusion[];
//# sourceMappingURL=enum.d.ts.map