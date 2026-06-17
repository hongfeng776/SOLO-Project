"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_MUTUAL_EXCLUSIONS = exports.AccountLevel = exports.PermissionType = exports.WithdrawStatus = exports.MarketingType = exports.MarketingStatus = exports.CommissionStatus = exports.OrderStatus = exports.PromoterStatus = exports.PromoterLevel = exports.ChannelType = exports.ChannelStatus = exports.CommonStatus = exports.UserStatus = exports.UserRole = void 0;
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
//# sourceMappingURL=enum.js.map