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

export enum AuditStage {
  PENDING_SUBMIT = 0,
  FIRST_AUDIT = 1,
  SECOND_AUDIT = 2,
  COMPLETED = 3,
  REJECTED = -1,
}

export enum AuditAction {
  SUBMIT = 'submit',
  FIRST_PASS = 'first_pass',
  FIRST_REJECT = 'first_reject',
  SECOND_PASS = 'second_pass',
  SECOND_REJECT = 'second_reject',
  ROLLBACK = 'rollback',
  BLACKLIST_BLOCK = 'blacklist_block',
}

export enum AuditStatus {
  PENDING = 'pending',
  FIRST_AUDITING = 'first_auditing',
  FIRST_PASSED = 'first_passed',
  SECOND_AUDITING = 'second_auditing',
  PASSED = 'passed',
  REJECTED = 'rejected',
  BLACKLISTED = 'blacklisted',
  LOCKED = 'locked',
}

export enum BlacklistType {
  PHONE = 'phone',
  ID_CARD = 'id_card',
  NAME = 'name',
  WECHAT = 'wechat',
}

export const REJECT_REASONS = [
  { code: 'incomplete_info', label: '申请信息不完整' },
  { code: 'invalid_phone', label: '手机号无效或已被使用' },
  { code: 'invalid_id_card', label: '身份证信息不合规' },
  { code: 'blacklist_match', label: '匹配黑名单记录' },
  { code: 'fraud_risk', label: '存在欺诈风险' },
  { code: 'duplicate_apply', label: '重复提交申请' },
  { code: 'data_tampered', label: '申请信息存在篡改痕迹' },
  { code: 'other', label: '其他原因' },
] as const;

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

export enum PermissionModule {
  SYSTEM = 'system',
  CHANNEL = 'channel',
  PROMOTER = 'promoter',
  ORDER = 'order',
  COMMISSION = 'commission',
  MARKETING = 'marketing',
  WITHDRAW = 'withdraw',
  LOG = 'log',
  DASHBOARD = 'dashboard',
}

export const PERMISSION_MODULE_LABELS: Record<string, string> = {
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

export enum VerifyStatus {
  UNVERIFIED = 0,
  PENDING = 1,
  VERIFIED = 2,
  REJECTED = -1,
}

export enum QualificationType {
  ID_CARD = 'id_card',
  BUSINESS_LICENSE = 'business_license',
  AGENCY_AGREEMENT = 'agency_agreement',
  OTHER = 'other',
}

export enum SettleStatus {
  NORMAL = 1,
  FROZEN = 0,
  CLOSED = -1,
}

export enum PromoteStatus {
  ACTIVE = 1,
  RESTRICTED = 0,
  BANNED = -1,
}

export const PROMOTER_LEVEL_CONFIGS: {
  level: PromoterLevel;
  commissionRate: number;
  maxChannels: number;
  canUseCoupon: boolean;
  canUseCashback: boolean;
  minOrderAmount: number;
  dailyWithdrawLimit: number;
}[] = [
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

export const BASIC_EDIT_FIELDS = [
  'name',
  'nickname',
  'avatar',
  'email',
  'phone',
  'wechatId',
  'idCardFrontImg',
  'idCardBackImg',
] as const;

export const ADMIN_EDIT_FIELDS = [
  ...BASIC_EDIT_FIELDS,
  'level',
  'channelId',
  'parentId',
  'status',
  'promoteStatus',
  'settleStatus',
  'commissionRate',
  'remark',
] as const;
