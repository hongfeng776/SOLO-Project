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
export declare enum AuditStage {
    PENDING_SUBMIT = 0,
    FIRST_AUDIT = 1,
    SECOND_AUDIT = 2,
    COMPLETED = 3,
    REJECTED = -1
}
export declare enum AuditAction {
    SUBMIT = "submit",
    FIRST_PASS = "first_pass",
    FIRST_REJECT = "first_reject",
    SECOND_PASS = "second_pass",
    SECOND_REJECT = "second_reject",
    ROLLBACK = "rollback",
    BLACKLIST_BLOCK = "blacklist_block"
}
export declare enum AuditStatus {
    PENDING = "pending",
    FIRST_AUDITING = "first_auditing",
    FIRST_PASSED = "first_passed",
    SECOND_AUDITING = "second_auditing",
    PASSED = "passed",
    REJECTED = "rejected",
    BLACKLISTED = "blacklisted",
    LOCKED = "locked"
}
export declare enum BlacklistType {
    PHONE = "phone",
    ID_CARD = "id_card",
    NAME = "name",
    WECHAT = "wechat"
}
export declare const REJECT_REASONS: readonly [{
    readonly code: "incomplete_info";
    readonly label: "申请信息不完整";
}, {
    readonly code: "invalid_phone";
    readonly label: "手机号无效或已被使用";
}, {
    readonly code: "invalid_id_card";
    readonly label: "身份证信息不合规";
}, {
    readonly code: "blacklist_match";
    readonly label: "匹配黑名单记录";
}, {
    readonly code: "fraud_risk";
    readonly label: "存在欺诈风险";
}, {
    readonly code: "duplicate_apply";
    readonly label: "重复提交申请";
}, {
    readonly code: "data_tampered";
    readonly label: "申请信息存在篡改痕迹";
}, {
    readonly code: "other";
    readonly label: "其他原因";
}];
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
export declare enum VerifyStatus {
    UNVERIFIED = 0,
    PENDING = 1,
    VERIFIED = 2,
    REJECTED = -1
}
export declare enum QualificationType {
    ID_CARD = "id_card",
    BUSINESS_LICENSE = "business_license",
    AGENCY_AGREEMENT = "agency_agreement",
    OTHER = "other"
}
export declare enum SettleStatus {
    NORMAL = 1,
    FROZEN = 0,
    CLOSED = -1
}
export declare enum PromoteStatus {
    ACTIVE = 1,
    RESTRICTED = 0,
    BANNED = -1
}
export declare const PROMOTER_LEVEL_CONFIGS: {
    level: PromoterLevel;
    commissionRate: number;
    maxChannels: number;
    canUseCoupon: boolean;
    canUseCashback: boolean;
    minOrderAmount: number;
    dailyWithdrawLimit: number;
}[];
export declare const BASIC_EDIT_FIELDS: readonly ["name", "nickname", "avatar", "email", "phone", "wechatId", "idCardFrontImg", "idCardBackImg"];
export declare const ADMIN_EDIT_FIELDS: readonly ["name", "nickname", "avatar", "email", "phone", "wechatId", "idCardFrontImg", "idCardBackImg", "level", "channelId", "parentId", "status", "promoteStatus", "settleStatus", "commissionRate", "remark"];
export declare enum ManualLevelAdjustStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = -1
}
export declare enum LevelChangeSource {
    AUTO = "auto",
    MANUAL = "manual",
    BATCH = "batch",
    RULE_CHANGE = "rule_change"
}
export interface LevelRuleThreshold {
    minMonthlyAmount: number;
    minMonthlyOrders: number;
    minActiveDays: number;
    minReputationScore: number;
}
export declare const LEVEL_RULE_THRESHOLDS: {
    level: PromoterLevel;
    threshold: LevelRuleThreshold;
}[];
export declare const LEVEL_CHANGE_SOURCE_LABELS: Record<LevelChangeSource, string>;
export declare enum RiskLevel {
    MILD = "mild",
    MODERATE = "moderate",
    SEVERE = "severe"
}
export declare enum RiskType {
    ABNORMAL_PROMOTION = "abnormal_promotion",
    BRUSH_ORDER = "brush_order",
    FAKE_ORDER = "fake_order",
    COMPLAINT = "complaint",
    FRAUD = "fraud",
    OTHER = "other"
}
export declare enum RiskControlStatus {
    NORMAL = 0,
    MILD_CONTROL = 1,
    MODERATE_CONTROL = 2,
    SEVERE_CONTROL = 3
}
export declare enum RiskReleaseStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = -1
}
export declare enum RiskWarningLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare const RISK_LEVEL_LABELS: Record<RiskLevel, {
    label: string;
    type: 'warning' | 'danger' | 'error';
    color: string;
}>;
export declare const RISK_TYPE_LABELS: Record<RiskType, string>;
export declare const RISK_CONTROL_PERMISSIONS: Record<RiskLevel, {
    canPromote: boolean;
    canJoinActivity: boolean;
    canWithdraw: boolean;
    canLogin: boolean;
}>;
export declare const RISK_RELEASE_STAGE_LABELS: readonly ["提交申请", "材料核验", "问题整改", "权限恢复1级", "权限恢复2级", "完全恢复"];
export declare const HIGH_FREQUENCY_THRESHOLD: {
    riskCountIn30Days: number;
    abnormalOrdersIn7Days: number;
    complaintCountIn30Days: number;
};
//# sourceMappingURL=enum.d.ts.map