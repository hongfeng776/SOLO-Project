export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 1,
  DISABLED = 0,
  DELETED = -1,
}

export enum CommonStatus {
  ENABLED = 1,
  DISABLED = 0,
}

export enum ChannelStatus {
  ENABLED = 1,
  DISABLED = 0,
}

export enum ChannelType {
  WECHAT = 'wechat',
  DOUYIN = 'douyin',
  KUAISHOU = 'kuaishou',
  XIAOHONGSHU = 'xiaohongshu',
  WEIBO = 'weibo',
  OTHER = 'other',
}

export enum PromoterLevel {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  L4 = 'L4',
  L5 = 'L5',
}

export enum PromoterStatus {
  NORMAL = 1,
  PENDING = 2,
  FROZEN = 0,
  CANCELLED = -1,
  REJECTED = -2,
}

export enum OrderStatus {
  PENDING_PAY = 0,
  PAID = 1,
  SHIPPED = 2,
  COMPLETED = 3,
  CANCELLED = 4,
  REFUNDING = 5,
  REFUNDED = 6,
}

export enum CommissionStatus {
  PENDING = 0,
  SETTLING = 1,
  SETTLED = 2,
  WITHDRAWN = 3,
  DEDUCTED = 4,
}

export enum MarketingStatus {
  DRAFT = 0,
  ONGOING = 1,
  ENDED = 2,
  CANCELLED = 3,
}

export enum MarketingType {
  COUPON = 'coupon',
  DISCOUNT = 'discount',
  CASHBACK = 'cashback',
  REBATE = 'rebate',
  BONUS = 'bonus',
}

export enum WithdrawStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  PAID = 3,
  FAILED = 4,
}

export enum PermissionType {
  MENU = 'menu',
  BUTTON = 'button',
  API = 'api',
}

export enum AccountLevel {
  SUPER_ADMIN = 1,
  ADMIN = 3,
  MANAGER = 5,
  OPERATOR = 7,
  VIEWER = 9,
}

export interface PermissionMutualExclusion {
  codes: [string, string];
  reason: string;
}

export const PERMISSION_MUTUAL_EXCLUSIONS: PermissionMutualExclusion[] = [
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
