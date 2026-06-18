"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HIGH_FREQUENCY_THRESHOLD = exports.RISK_RELEASE_STAGE_LABELS = exports.RISK_CONTROL_PERMISSIONS = exports.RISK_TYPE_LABELS = exports.RISK_LEVEL_LABELS = exports.RiskWarningLevel = exports.RiskReleaseStatus = exports.RiskControlStatus = exports.RiskType = exports.RiskLevel = exports.LEVEL_CHANGE_SOURCE_LABELS = exports.LEVEL_RULE_THRESHOLDS = exports.LevelChangeSource = exports.ManualLevelAdjustStatus = exports.ADMIN_EDIT_FIELDS = exports.BASIC_EDIT_FIELDS = exports.PROMOTER_LEVEL_CONFIGS = exports.PromoteStatus = exports.SettleStatus = exports.QualificationType = exports.VerifyStatus = exports.PERMISSION_MUTUAL_EXCLUSIONS = exports.AccountLevel = exports.PERMISSION_MODULE_LABELS = exports.PermissionModule = exports.PermissionType = exports.WithdrawStatus = exports.MarketingType = exports.MarketingStatus = exports.CommissionStatus = exports.OrderStatus = exports.REJECT_REASONS = exports.BlacklistType = exports.AuditStatus = exports.AuditAction = exports.AuditStage = exports.PromoterStatus = exports.PromoterLevel = exports.ChannelType = exports.ChannelStatus = exports.CommonStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["GUEST"] = "guest";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus[UserStatus["ACTIVE"] = 1] = "ACTIVE";
    UserStatus[UserStatus["DISABLED"] = 0] = "DISABLED";
    UserStatus[UserStatus["DELETED"] = -1] = "DELETED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var CommonStatus;
(function (CommonStatus) {
    CommonStatus[CommonStatus["ENABLED"] = 1] = "ENABLED";
    CommonStatus[CommonStatus["DISABLED"] = 0] = "DISABLED";
})(CommonStatus || (exports.CommonStatus = CommonStatus = {}));
var ChannelStatus;
(function (ChannelStatus) {
    ChannelStatus[ChannelStatus["ENABLED"] = 1] = "ENABLED";
    ChannelStatus[ChannelStatus["DISABLED"] = 0] = "DISABLED";
})(ChannelStatus || (exports.ChannelStatus = ChannelStatus = {}));
var ChannelType;
(function (ChannelType) {
    ChannelType["WECHAT"] = "wechat";
    ChannelType["DOUYIN"] = "douyin";
    ChannelType["KUAISHOU"] = "kuaishou";
    ChannelType["XIAOHONGSHU"] = "xiaohongshu";
    ChannelType["WEIBO"] = "weibo";
    ChannelType["OTHER"] = "other";
})(ChannelType || (exports.ChannelType = ChannelType = {}));
var PromoterLevel;
(function (PromoterLevel) {
    PromoterLevel["L1"] = "L1";
    PromoterLevel["L2"] = "L2";
    PromoterLevel["L3"] = "L3";
    PromoterLevel["L4"] = "L4";
    PromoterLevel["L5"] = "L5";
})(PromoterLevel || (exports.PromoterLevel = PromoterLevel = {}));
var PromoterStatus;
(function (PromoterStatus) {
    PromoterStatus[PromoterStatus["NORMAL"] = 1] = "NORMAL";
    PromoterStatus[PromoterStatus["PENDING"] = 2] = "PENDING";
    PromoterStatus[PromoterStatus["FROZEN"] = 0] = "FROZEN";
    PromoterStatus[PromoterStatus["CANCELLED"] = -1] = "CANCELLED";
    PromoterStatus[PromoterStatus["REJECTED"] = -2] = "REJECTED";
})(PromoterStatus || (exports.PromoterStatus = PromoterStatus = {}));
var AuditStage;
(function (AuditStage) {
    AuditStage[AuditStage["PENDING_SUBMIT"] = 0] = "PENDING_SUBMIT";
    AuditStage[AuditStage["FIRST_AUDIT"] = 1] = "FIRST_AUDIT";
    AuditStage[AuditStage["SECOND_AUDIT"] = 2] = "SECOND_AUDIT";
    AuditStage[AuditStage["COMPLETED"] = 3] = "COMPLETED";
    AuditStage[AuditStage["REJECTED"] = -1] = "REJECTED";
})(AuditStage || (exports.AuditStage = AuditStage = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["SUBMIT"] = "submit";
    AuditAction["FIRST_PASS"] = "first_pass";
    AuditAction["FIRST_REJECT"] = "first_reject";
    AuditAction["SECOND_PASS"] = "second_pass";
    AuditAction["SECOND_REJECT"] = "second_reject";
    AuditAction["ROLLBACK"] = "rollback";
    AuditAction["BLACKLIST_BLOCK"] = "blacklist_block";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditStatus;
(function (AuditStatus) {
    AuditStatus["PENDING"] = "pending";
    AuditStatus["FIRST_AUDITING"] = "first_auditing";
    AuditStatus["FIRST_PASSED"] = "first_passed";
    AuditStatus["SECOND_AUDITING"] = "second_auditing";
    AuditStatus["PASSED"] = "passed";
    AuditStatus["REJECTED"] = "rejected";
    AuditStatus["BLACKLISTED"] = "blacklisted";
    AuditStatus["LOCKED"] = "locked";
})(AuditStatus || (exports.AuditStatus = AuditStatus = {}));
var BlacklistType;
(function (BlacklistType) {
    BlacklistType["PHONE"] = "phone";
    BlacklistType["ID_CARD"] = "id_card";
    BlacklistType["NAME"] = "name";
    BlacklistType["WECHAT"] = "wechat";
})(BlacklistType || (exports.BlacklistType = BlacklistType = {}));
exports.REJECT_REASONS = [
    { code: 'incomplete_info', label: '申请信息不完整' },
    { code: 'invalid_phone', label: '手机号无效或已被使用' },
    { code: 'invalid_id_card', label: '身份证信息不合规' },
    { code: 'blacklist_match', label: '匹配黑名单记录' },
    { code: 'fraud_risk', label: '存在欺诈风险' },
    { code: 'duplicate_apply', label: '重复提交申请' },
    { code: 'data_tampered', label: '申请信息存在篡改痕迹' },
    { code: 'other', label: '其他原因' },
];
var OrderStatus;
(function (OrderStatus) {
    OrderStatus[OrderStatus["PENDING_PAY"] = 0] = "PENDING_PAY";
    OrderStatus[OrderStatus["PAID"] = 1] = "PAID";
    OrderStatus[OrderStatus["SHIPPED"] = 2] = "SHIPPED";
    OrderStatus[OrderStatus["COMPLETED"] = 3] = "COMPLETED";
    OrderStatus[OrderStatus["CANCELLED"] = 4] = "CANCELLED";
    OrderStatus[OrderStatus["REFUNDING"] = 5] = "REFUNDING";
    OrderStatus[OrderStatus["REFUNDED"] = 6] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var CommissionStatus;
(function (CommissionStatus) {
    CommissionStatus[CommissionStatus["PENDING"] = 0] = "PENDING";
    CommissionStatus[CommissionStatus["SETTLING"] = 1] = "SETTLING";
    CommissionStatus[CommissionStatus["SETTLED"] = 2] = "SETTLED";
    CommissionStatus[CommissionStatus["WITHDRAWN"] = 3] = "WITHDRAWN";
    CommissionStatus[CommissionStatus["DEDUCTED"] = 4] = "DEDUCTED";
})(CommissionStatus || (exports.CommissionStatus = CommissionStatus = {}));
var MarketingStatus;
(function (MarketingStatus) {
    MarketingStatus[MarketingStatus["DRAFT"] = 0] = "DRAFT";
    MarketingStatus[MarketingStatus["ONGOING"] = 1] = "ONGOING";
    MarketingStatus[MarketingStatus["ENDED"] = 2] = "ENDED";
    MarketingStatus[MarketingStatus["CANCELLED"] = 3] = "CANCELLED";
})(MarketingStatus || (exports.MarketingStatus = MarketingStatus = {}));
var MarketingType;
(function (MarketingType) {
    MarketingType["COUPON"] = "coupon";
    MarketingType["DISCOUNT"] = "discount";
    MarketingType["CASHBACK"] = "cashback";
    MarketingType["REBATE"] = "rebate";
    MarketingType["BONUS"] = "bonus";
})(MarketingType || (exports.MarketingType = MarketingType = {}));
var WithdrawStatus;
(function (WithdrawStatus) {
    WithdrawStatus[WithdrawStatus["PENDING"] = 0] = "PENDING";
    WithdrawStatus[WithdrawStatus["APPROVED"] = 1] = "APPROVED";
    WithdrawStatus[WithdrawStatus["REJECTED"] = 2] = "REJECTED";
    WithdrawStatus[WithdrawStatus["PAID"] = 3] = "PAID";
    WithdrawStatus[WithdrawStatus["FAILED"] = 4] = "FAILED";
})(WithdrawStatus || (exports.WithdrawStatus = WithdrawStatus = {}));
var PermissionType;
(function (PermissionType) {
    PermissionType["MENU"] = "menu";
    PermissionType["BUTTON"] = "button";
    PermissionType["API"] = "api";
})(PermissionType || (exports.PermissionType = PermissionType = {}));
var PermissionModule;
(function (PermissionModule) {
    PermissionModule["SYSTEM"] = "system";
    PermissionModule["CHANNEL"] = "channel";
    PermissionModule["PROMOTER"] = "promoter";
    PermissionModule["ORDER"] = "order";
    PermissionModule["COMMISSION"] = "commission";
    PermissionModule["MARKETING"] = "marketing";
    PermissionModule["WITHDRAW"] = "withdraw";
    PermissionModule["LOG"] = "log";
    PermissionModule["DASHBOARD"] = "dashboard";
})(PermissionModule || (exports.PermissionModule = PermissionModule = {}));
exports.PERMISSION_MODULE_LABELS = {
    system: '系统管理',
    channel: '渠道管理',
    promoter: '推客管理',
    order: '订单管理',
    commission: '佣金管理',
    marketing: '营销管理',
    withdraw: '提现管理',
    log: '日志管理',
    dashboard: '数据看板',
};
var AccountLevel;
(function (AccountLevel) {
    AccountLevel[AccountLevel["SUPER_ADMIN"] = 1] = "SUPER_ADMIN";
    AccountLevel[AccountLevel["ADMIN"] = 3] = "ADMIN";
    AccountLevel[AccountLevel["MANAGER"] = 5] = "MANAGER";
    AccountLevel[AccountLevel["OPERATOR"] = 7] = "OPERATOR";
    AccountLevel[AccountLevel["VIEWER"] = 9] = "VIEWER";
})(AccountLevel || (exports.AccountLevel = AccountLevel = {}));
exports.PERMISSION_MUTUAL_EXCLUSIONS = [
    {
        codes: ['user:create', 'role:assign'],
        reason: '创建用户与分配角色互斥，防止越权创建高权限账号',
    },
    {
        codes: ['user:delete', 'log:delete'],
        reason: '删除用户与删除日志互斥，防止销毁操作痕迹',
    },
    {
        codes: ['commission:settle', 'withdraw:approve'],
        reason: '佣金结算与提现审批互斥，防止财务操作风险',
    },
];
var VerifyStatus;
(function (VerifyStatus) {
    VerifyStatus[VerifyStatus["UNVERIFIED"] = 0] = "UNVERIFIED";
    VerifyStatus[VerifyStatus["PENDING"] = 1] = "PENDING";
    VerifyStatus[VerifyStatus["VERIFIED"] = 2] = "VERIFIED";
    VerifyStatus[VerifyStatus["REJECTED"] = -1] = "REJECTED";
})(VerifyStatus || (exports.VerifyStatus = VerifyStatus = {}));
var QualificationType;
(function (QualificationType) {
    QualificationType["ID_CARD"] = "id_card";
    QualificationType["BUSINESS_LICENSE"] = "business_license";
    QualificationType["AGENCY_AGREEMENT"] = "agency_agreement";
    QualificationType["OTHER"] = "other";
})(QualificationType || (exports.QualificationType = QualificationType = {}));
var SettleStatus;
(function (SettleStatus) {
    SettleStatus[SettleStatus["NORMAL"] = 1] = "NORMAL";
    SettleStatus[SettleStatus["FROZEN"] = 0] = "FROZEN";
    SettleStatus[SettleStatus["CLOSED"] = -1] = "CLOSED";
})(SettleStatus || (exports.SettleStatus = SettleStatus = {}));
var PromoteStatus;
(function (PromoteStatus) {
    PromoteStatus[PromoteStatus["ACTIVE"] = 1] = "ACTIVE";
    PromoteStatus[PromoteStatus["RESTRICTED"] = 0] = "RESTRICTED";
    PromoteStatus[PromoteStatus["BANNED"] = -1] = "BANNED";
})(PromoteStatus || (exports.PromoteStatus = PromoteStatus = {}));
exports.PROMOTER_LEVEL_CONFIGS = [
    {
        level: PromoterLevel.L1,
        commissionRate: 0.05,
        maxChannels: 1,
        canUseCoupon: false,
        canUseCashback: false,
        minOrderAmount: 100,
        dailyWithdrawLimit: 500,
    },
    {
        level: PromoterLevel.L2,
        commissionRate: 0.08,
        maxChannels: 3,
        canUseCoupon: false,
        canUseCashback: true,
        minOrderAmount: 80,
        dailyWithdrawLimit: 2000,
    },
    {
        level: PromoterLevel.L3,
        commissionRate: 0.12,
        maxChannels: 5,
        canUseCoupon: true,
        canUseCashback: true,
        minOrderAmount: 50,
        dailyWithdrawLimit: 5000,
    },
    {
        level: PromoterLevel.L4,
        commissionRate: 0.15,
        maxChannels: 10,
        canUseCoupon: true,
        canUseCashback: true,
        minOrderAmount: 30,
        dailyWithdrawLimit: 20000,
    },
    {
        level: PromoterLevel.L5,
        commissionRate: 0.2,
        maxChannels: 999,
        canUseCoupon: true,
        canUseCashback: true,
        minOrderAmount: 0,
        dailyWithdrawLimit: 999999,
    },
];
exports.BASIC_EDIT_FIELDS = [
    'name',
    'nickname',
    'avatar',
    'email',
    'phone',
    'wechatId',
    'idCardFrontImg',
    'idCardBackImg',
];
exports.ADMIN_EDIT_FIELDS = [
    ...exports.BASIC_EDIT_FIELDS,
    'level',
    'channelId',
    'parentId',
    'status',
    'promoteStatus',
    'settleStatus',
    'commissionRate',
    'remark',
];
var ManualLevelAdjustStatus;
(function (ManualLevelAdjustStatus) {
    ManualLevelAdjustStatus[ManualLevelAdjustStatus["PENDING"] = 0] = "PENDING";
    ManualLevelAdjustStatus[ManualLevelAdjustStatus["APPROVED"] = 1] = "APPROVED";
    ManualLevelAdjustStatus[ManualLevelAdjustStatus["REJECTED"] = -1] = "REJECTED";
})(ManualLevelAdjustStatus || (exports.ManualLevelAdjustStatus = ManualLevelAdjustStatus = {}));
var LevelChangeSource;
(function (LevelChangeSource) {
    LevelChangeSource["AUTO"] = "auto";
    LevelChangeSource["MANUAL"] = "manual";
    LevelChangeSource["BATCH"] = "batch";
    LevelChangeSource["RULE_CHANGE"] = "rule_change";
})(LevelChangeSource || (exports.LevelChangeSource = LevelChangeSource = {}));
exports.LEVEL_RULE_THRESHOLDS = [
    {
        level: PromoterLevel.L1,
        threshold: {
            minMonthlyAmount: 0,
            minMonthlyOrders: 0,
            minActiveDays: 0,
            minReputationScore: 0,
        },
    },
    {
        level: PromoterLevel.L2,
        threshold: {
            minMonthlyAmount: 10000,
            minMonthlyOrders: 50,
            minActiveDays: 10,
            minReputationScore: 90,
        },
    },
    {
        level: PromoterLevel.L3,
        threshold: {
            minMonthlyAmount: 50000,
            minMonthlyOrders: 200,
            minActiveDays: 20,
            minReputationScore: 95,
        },
    },
    {
        level: PromoterLevel.L4,
        threshold: {
            minMonthlyAmount: 200000,
            minMonthlyOrders: 800,
            minActiveDays: 25,
            minReputationScore: 97,
        },
    },
    {
        level: PromoterLevel.L5,
        threshold: {
            minMonthlyAmount: 1000000,
            minMonthlyOrders: 3000,
            minActiveDays: 28,
            minReputationScore: 99,
        },
    },
];
exports.LEVEL_CHANGE_SOURCE_LABELS = {
    auto: '自动评级',
    manual: '手动调整',
    batch: '批量重置',
    rule_change: '规则变更触发',
};
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["MILD"] = "mild";
    RiskLevel["MODERATE"] = "moderate";
    RiskLevel["SEVERE"] = "severe";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var RiskType;
(function (RiskType) {
    RiskType["ABNORMAL_PROMOTION"] = "abnormal_promotion";
    RiskType["BRUSH_ORDER"] = "brush_order";
    RiskType["FAKE_ORDER"] = "fake_order";
    RiskType["COMPLAINT"] = "complaint";
    RiskType["FRAUD"] = "fraud";
    RiskType["OTHER"] = "other";
})(RiskType || (exports.RiskType = RiskType = {}));
var RiskControlStatus;
(function (RiskControlStatus) {
    RiskControlStatus[RiskControlStatus["NORMAL"] = 0] = "NORMAL";
    RiskControlStatus[RiskControlStatus["MILD_CONTROL"] = 1] = "MILD_CONTROL";
    RiskControlStatus[RiskControlStatus["MODERATE_CONTROL"] = 2] = "MODERATE_CONTROL";
    RiskControlStatus[RiskControlStatus["SEVERE_CONTROL"] = 3] = "SEVERE_CONTROL";
})(RiskControlStatus || (exports.RiskControlStatus = RiskControlStatus = {}));
var RiskReleaseStatus;
(function (RiskReleaseStatus) {
    RiskReleaseStatus[RiskReleaseStatus["PENDING"] = 0] = "PENDING";
    RiskReleaseStatus[RiskReleaseStatus["APPROVED"] = 1] = "APPROVED";
    RiskReleaseStatus[RiskReleaseStatus["REJECTED"] = -1] = "REJECTED";
})(RiskReleaseStatus || (exports.RiskReleaseStatus = RiskReleaseStatus = {}));
var RiskWarningLevel;
(function (RiskWarningLevel) {
    RiskWarningLevel["LOW"] = "low";
    RiskWarningLevel["MEDIUM"] = "medium";
    RiskWarningLevel["HIGH"] = "high";
})(RiskWarningLevel || (exports.RiskWarningLevel = RiskWarningLevel = {}));
exports.RISK_LEVEL_LABELS = {
    mild: { label: '轻度风控', type: 'warning', color: '#e6a23c' },
    moderate: { label: '中度风控', type: 'danger', color: '#f56c6c' },
    severe: { label: '重度风控', type: 'error', color: '#c0392b' },
};
exports.RISK_TYPE_LABELS = {
    abnormal_promotion: '异常推广',
    brush_order: '刷单',
    fake_order: '虚假订单',
    complaint: '投诉举报',
    fraud: '欺诈风险',
    other: '其他',
};
exports.RISK_CONTROL_PERMISSIONS = {
    mild: {
        canPromote: true,
        canJoinActivity: false,
        canWithdraw: true,
        canLogin: true,
    },
    moderate: {
        canPromote: true,
        canJoinActivity: false,
        canWithdraw: false,
        canLogin: true,
    },
    severe: {
        canPromote: false,
        canJoinActivity: false,
        canWithdraw: false,
        canLogin: false,
    },
};
exports.RISK_RELEASE_STAGE_LABELS = [
    '提交申请',
    '材料核验',
    '问题整改',
    '权限恢复1级',
    '权限恢复2级',
    '完全恢复',
];
exports.HIGH_FREQUENCY_THRESHOLD = {
    riskCountIn30Days: 3,
    abnormalOrdersIn7Days: 10,
    complaintCountIn30Days: 2,
};
//# sourceMappingURL=enum.js.map