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
  PAUSED = 4,
}

export const MARKETING_STATUS_LABELS: Record<MarketingStatus, { label: string; type: 'info' | 'success' | 'danger' | 'warning' }> = {
  [MarketingStatus.DRAFT]: { label: '未开始', type: 'info' },
  [MarketingStatus.ONGOING]: { label: '进行中', type: 'success' },
  [MarketingStatus.ENDED]: { label: '已结束', type: 'danger' },
  [MarketingStatus.CANCELLED]: { label: '已作废', type: 'danger' },
  [MarketingStatus.PAUSED]: { label: '已暂停', type: 'warning' },
};

export interface StatusTransitionRule {
  from: MarketingStatus;
  to: MarketingStatus[];
  requiredPermissions?: string[];
  requireNoActiveParticipation?: boolean;
  requireNoPendingReward?: boolean;
}

export const STATUS_TRANSITION_RULES: StatusTransitionRule[] = [
  { from: MarketingStatus.DRAFT, to: [MarketingStatus.ONGOING, MarketingStatus.CANCELLED] },
  { from: MarketingStatus.ONGOING, to: [MarketingStatus.PAUSED, MarketingStatus.ENDED] },
  { from: MarketingStatus.PAUSED, to: [MarketingStatus.ONGOING, MarketingStatus.CANCELLED, MarketingStatus.ENDED] },
  { from: MarketingStatus.ENDED, to: [] },
  { from: MarketingStatus.CANCELLED, to: [] },
];

export enum EditPermissionLevel {
  FULL = 'full',
  PARTIAL = 'partial',
  NONE = 'none',
}

export const STATUS_EDIT_PERMISSIONS: Record<MarketingStatus, { level: EditPermissionLevel; allowedFields: string[]; blockedFields: string[] }> = {
  [MarketingStatus.DRAFT]: {
    level: EditPermissionLevel.FULL,
    allowedFields: ['*'],
    blockedFields: [],
  },
  [MarketingStatus.ONGOING]: {
    level: EditPermissionLevel.PARTIAL,
    allowedFields: ['name', 'description', 'coverImage', 'sort', 'channels'],
    blockedFields: ['type', 'startTime', 'endTime', 'rules', 'participationThresholds', 'productConfig', 'rewardRuleId'],
  },
  [MarketingStatus.PAUSED]: {
    level: EditPermissionLevel.PARTIAL,
    allowedFields: ['name', 'description', 'coverImage', 'sort', 'channels'],
    blockedFields: ['type', 'startTime', 'endTime', 'rules', 'participationThresholds', 'productConfig', 'rewardRuleId'],
  },
  [MarketingStatus.ENDED]: {
    level: EditPermissionLevel.NONE,
    allowedFields: [],
    blockedFields: ['*'],
  },
  [MarketingStatus.CANCELLED]: {
    level: EditPermissionLevel.NONE,
    allowedFields: [],
    blockedFields: ['*'],
  },
};

export enum ActivityStatusChangeType {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  END = 'end',
  CANCEL = 'cancel',
  BATCH_PAUSE = 'batch_pause',
  BATCH_RESUME = 'batch_resume',
  BATCH_END = 'batch_end',
  BATCH_CANCEL = 'batch_cancel',
  AUTO_END = 'auto_end',
  EXTEND = 'extend',
}

export const ACTIVITY_STATUS_CHANGE_TYPE_LABELS: Record<ActivityStatusChangeType, string> = {
  [ActivityStatusChangeType.START]: '启动活动',
  [ActivityStatusChangeType.PAUSE]: '暂停活动',
  [ActivityStatusChangeType.RESUME]: '恢复活动',
  [ActivityStatusChangeType.END]: '结束活动',
  [ActivityStatusChangeType.CANCEL]: '作废活动',
  [ActivityStatusChangeType.BATCH_PAUSE]: '批量暂停',
  [ActivityStatusChangeType.BATCH_RESUME]: '批量恢复',
  [ActivityStatusChangeType.BATCH_END]: '批量结束',
  [ActivityStatusChangeType.BATCH_CANCEL]: '批量作废',
  [ActivityStatusChangeType.AUTO_END]: '自动结束',
  [ActivityStatusChangeType.EXTEND]: '延期活动',
};

export const ACTIVITY_CORE_FIELDS = [
  'type',
  'startTime',
  'endTime',
  'rules',
  'participationThresholds',
  'productConfig',
  'rewardRuleId',
  'budget',
  'maxCommissionRate',
];

export const ACTIVITY_NON_CORE_FIELDS = [
  'name',
  'description',
  'coverImage',
  'sort',
  'channels',
];

export enum MarketingType {
  COUPON = 'coupon',
  DISCOUNT = 'discount',
  CASHBACK = 'cashback',
  REBATE = 'rebate',
  BONUS = 'bonus',
  DISTRIBUTION_LADDER = 'distribution_ladder',
  DISTRIBUTION_RANKING = 'distribution_ranking',
  DISTRIBUTION_FULL_AMOUNT = 'distribution_full_amount',
  DISTRIBUTION_NEW_USER = 'distribution_new_user',
  DISTRIBUTION_INVITE = 'distribution_invite',
}

export const MARKETING_TYPE_LABELS: Record<MarketingType, string> = {
  [MarketingType.COUPON]: '优惠券',
  [MarketingType.DISCOUNT]: '折扣',
  [MarketingType.CASHBACK]: '返现',
  [MarketingType.REBATE]: '返利',
  [MarketingType.BONUS]: '奖金',
  [MarketingType.DISTRIBUTION_LADDER]: '阶梯奖励',
  [MarketingType.DISTRIBUTION_RANKING]: '排名奖励',
  [MarketingType.DISTRIBUTION_FULL_AMOUNT]: '满额奖励',
  [MarketingType.DISTRIBUTION_NEW_USER]: '新用户奖励',
  [MarketingType.DISTRIBUTION_INVITE]: '邀请奖励',
};

export enum DistributionActivityType {
  LADDER_REWARD = 'ladder_reward',
  RANKING_REWARD = 'ranking_reward',
  FULL_AMOUNT_REWARD = 'full_amount_reward',
}

export const DISTRIBUTION_ACTIVITY_TYPE_LABELS: Record<DistributionActivityType, string> = {
  [DistributionActivityType.LADDER_REWARD]: '阶梯奖励',
  [DistributionActivityType.RANKING_REWARD]: '排名奖励',
  [DistributionActivityType.FULL_AMOUNT_REWARD]: '满额奖励',
};

export enum RewardRuleType {
  LADDER = 'ladder',
  RANKING = 'ranking',
  FULL_AMOUNT = 'full_amount',
}

export const REWARD_RULE_TYPE_LABELS: Record<RewardRuleType, string> = {
  [RewardRuleType.LADDER]: '阶梯奖励',
  [RewardRuleType.RANKING]: '排名奖励',
  [RewardRuleType.FULL_AMOUNT]: '满额奖励',
};

export const REWARD_RULE_MUTUAL_EXCLUSIONS: RewardRuleType[][] = [
  [RewardRuleType.LADDER, RewardRuleType.RANKING],
  [RewardRuleType.LADDER, RewardRuleType.FULL_AMOUNT],
  [RewardRuleType.RANKING, RewardRuleType.FULL_AMOUNT],
];

export enum ParticipationThresholdType {
  LEVEL = 'level',
  TOTAL_ORDERS = 'total_orders',
  TOTAL_AMOUNT = 'total_amount',
  REGISTRATION_DAYS = 'registration_days',
  QUALIFICATION_VERIFIED = 'qualification_verified',
  SPECIFIC_PROMOTERS = 'specific_promoters',
}

export const PARTICIPATION_THRESHOLD_LABELS: Record<ParticipationThresholdType, string> = {
  [ParticipationThresholdType.LEVEL]: '推客等级',
  [ParticipationThresholdType.TOTAL_ORDERS]: '累计订单数',
  [ParticipationThresholdType.TOTAL_AMOUNT]: '累计成交额',
  [ParticipationThresholdType.REGISTRATION_DAYS]: '注册天数',
  [ParticipationThresholdType.QUALIFICATION_VERIFIED]: '资质认证',
  [ParticipationThresholdType.SPECIFIC_PROMOTERS]: '指定推客',
};

export enum ActivityTemplateCategory {
  HOT_SALE = 'hot_sale',
  NEW_PRODUCT = 'new_product',
  FESTIVAL = 'festival',
  MEMBER_DAY = 'member_day',
  CLEARANCE = 'clearance',
  CUSTOM = 'custom',
}

export const ACTIVITY_TEMPLATE_CATEGORY_LABELS: Record<ActivityTemplateCategory, string> = {
  [ActivityTemplateCategory.HOT_SALE]: '热销爆款',
  [ActivityTemplateCategory.NEW_PRODUCT]: '新品上市',
  [ActivityTemplateCategory.FESTIVAL]: '节日促销',
  [ActivityTemplateCategory.MEMBER_DAY]: '会员日',
  [ActivityTemplateCategory.CLEARANCE]: '清仓特惠',
  [ActivityTemplateCategory.CUSTOM]: '自定义',
};

export enum ActivityOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPDATE_STATUS = 'update_status',
  UPDATE_REWARD_RULES = 'update_reward_rules',
  UPDATE_PARTICIPANTS = 'update_participants',
  UPDATE_PRODUCTS = 'update_products',
  PREVIEW = 'preview',
  COPY_TEMPLATE = 'copy_template',
  BATCH_CREATE = 'batch_create',
  BATCH_UPDATE = 'batch_update',
  UPDATE_SORT = 'update_sort',
}

export const ACTIVITY_OPERATION_TYPE_LABELS: Record<ActivityOperationType, string> = {
  [ActivityOperationType.CREATE]: '创建活动',
  [ActivityOperationType.UPDATE]: '更新活动',
  [ActivityOperationType.DELETE]: '删除活动',
  [ActivityOperationType.UPDATE_STATUS]: '更新状态',
  [ActivityOperationType.UPDATE_REWARD_RULES]: '更新奖励规则',
  [ActivityOperationType.UPDATE_PARTICIPANTS]: '更新参与对象',
  [ActivityOperationType.UPDATE_PRODUCTS]: '更新适用商品',
  [ActivityOperationType.PREVIEW]: '预览活动',
  [ActivityOperationType.COPY_TEMPLATE]: '复制模板',
  [ActivityOperationType.BATCH_CREATE]: '批量创建',
  [ActivityOperationType.BATCH_UPDATE]: '批量更新',
  [ActivityOperationType.UPDATE_SORT]: '更新排序',
};

export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export const DISTRIBUTION_REWARD_MAX_RATE = 0.5;
export const DISTRIBUTION_REWARD_MIN_AMOUNT = 0.01;
export const DISTRIBUTION_REWARD_MAX_AMOUNT = 10000;

export const ACTIVITY_NAME_MAX_LENGTH = 100;
export const ACTIVITY_DESCRIPTION_MAX_LENGTH = 2000;

export const LADDER_REWARD_MAX_LEVELS = 10;
export const RANKING_REWARD_MAX_RANKS = 100;
export const FULL_AMOUNT_REWARD_MAX_THRESHOLDS = 10;

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

export enum ManualLevelAdjustStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = -1,
}

export enum LevelChangeSource {
  AUTO = 'auto',
  MANUAL = 'manual',
  BATCH = 'batch',
  RULE_CHANGE = 'rule_change',
}

export interface LevelRuleThreshold {
  minMonthlyAmount: number;
  minMonthlyOrders: number;
  minActiveDays: number;
  minReputationScore: number;
}

export const LEVEL_RULE_THRESHOLDS: { level: PromoterLevel; threshold: LevelRuleThreshold }[] = [
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

export const LEVEL_CHANGE_SOURCE_LABELS: Record<LevelChangeSource, string> = {
  auto: '自动评级',
  manual: '手动调整',
  batch: '批量重置',
  rule_change: '规则变更触发',
};

export enum RiskLevel {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum RiskType {
  ABNORMAL_PROMOTION = 'abnormal_promotion',
  BRUSH_ORDER = 'brush_order',
  FAKE_ORDER = 'fake_order',
  COMPLAINT = 'complaint',
  FRAUD = 'fraud',
  OTHER = 'other',
}

export enum RiskControlStatus {
  NORMAL = 0,
  MILD_CONTROL = 1,
  MODERATE_CONTROL = 2,
  SEVERE_CONTROL = 3,
}

export enum RiskReleaseStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = -1,
}

export enum RiskWarningLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, { label: string; type: 'warning' | 'danger' | 'error'; color: string }> = {
  mild: { label: '轻度风控', type: 'warning', color: '#e6a23c' },
  moderate: { label: '中度风控', type: 'danger', color: '#f56c6c' },
  severe: { label: '重度风控', type: 'error', color: '#c0392b' },
};

export const RISK_TYPE_LABELS: Record<RiskType, string> = {
  abnormal_promotion: '异常推广',
  brush_order: '刷单',
  fake_order: '虚假订单',
  complaint: '投诉举报',
  fraud: '欺诈风险',
  other: '其他',
};

export const RISK_CONTROL_PERMISSIONS: Record<RiskLevel, {
  canPromote: boolean;
  canJoinActivity: boolean;
  canWithdraw: boolean;
  canLogin: boolean;
}> = {
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

export const RISK_RELEASE_STAGE_LABELS = [
  '提交申请',
  '材料核验',
  '问题整改',
  '权限恢复1级',
  '权限恢复2级',
  '完全恢复',
] as const;

export const HIGH_FREQUENCY_THRESHOLD = {
  riskCountIn30Days: 3,
  abnormalOrdersIn7Days: 10,
  complaintCountIn30Days: 2,
};

export enum ChannelAuditStage {
  PENDING_SUBMIT = 0,
  DATA_REVIEW = 1,
  QUALIFICATION_VERIFY = 2,
  PERMISSION_ACTIVATE = 3,
  COMPLETED = 4,
  REJECTED = -1,
}

export enum ChannelAuditAction {
  SUBMIT = 'submit',
  DATA_PASS = 'data_pass',
  DATA_REJECT = 'data_reject',
  QUALIFICATION_PASS = 'qualification_pass',
  QUALIFICATION_REJECT = 'qualification_reject',
  PERMISSION_PASS = 'permission_pass',
  PERMISSION_REJECT = 'permission_reject',
  BLACKLIST_BLOCK = 'blacklist_block',
}

export enum ChannelAuditStatus {
  PENDING = 'pending',
  DATA_AUDITING = 'data_auditing',
  DATA_PASSED = 'data_passed',
  QUALIFICATION_AUDITING = 'qualification_auditing',
  QUALIFICATION_PASSED = 'qualification_passed',
  PERMISSION_AUDITING = 'permission_auditing',
  PASSED = 'passed',
  REJECTED = 'rejected',
  BLACKLISTED = 'blacklisted',
  LOCKED = 'locked',
}

export enum ChannelBlacklistType {
  COMPANY_NAME = 'company_name',
  CREDIT_CODE = 'credit_code',
  CONTACT_PHONE = 'contact_phone',
  LEGAL_PERSON = 'legal_person',
}

export enum ChannelRejectIssueType {
  MISSING_DOCS = 'missing_docs',
  EXPIRED_QUALIFICATION = 'expired_qualification',
  FALSE_INFO = 'false_info',
  INVALID_CONTACT = 'invalid_contact',
  DUPLICATE_SUBJECT = 'duplicate_subject',
  BLACKLIST_MATCH = 'blacklist_match',
  CREDIT_ABNORMAL = 'credit_abnormal',
  OTHER = 'other',
}

export const CHANNEL_REJECT_ISSUE_LABELS: Record<ChannelRejectIssueType, string> = {
  missing_docs: '资料缺失',
  expired_qualification: '资质过期',
  false_info: '信息虚假',
  invalid_contact: '联系方式无效',
  duplicate_subject: '合作主体重复',
  blacklist_match: '匹配黑名单',
  credit_abnormal: '企业征信异常',
  other: '其他问题',
};

export enum ChannelPriority {
  NORMAL = 0,
  IMPORTANT = 1,
  KEY = 2,
}

export const CHANNEL_PRIORITY_LABELS: Record<ChannelPriority, { label: string; type: string }> = {
  [ChannelPriority.NORMAL]: { label: '普通渠道', type: 'info' },
  [ChannelPriority.IMPORTANT]: { label: '重要渠道', type: 'warning' },
  [ChannelPriority.KEY]: { label: '重点合作', type: 'danger' },
};

export enum ChannelQualificationType {
  BUSINESS_LICENSE = 'business_license',
  ID_CARD = 'id_card',
  BANK_ACCOUNT = 'bank_account',
  TAX_CERTIFICATE = 'tax_certificate',
  AGENCY_AGREEMENT = 'agency_agreement',
  OTHER = 'other',
}

export const CHANNEL_AUDIT_STAGES = [
  { key: ChannelAuditStage.DATA_REVIEW, label: '资料初审', description: '审核渠道基本资料完整性' },
  { key: ChannelAuditStage.QUALIFICATION_VERIFY, label: '资质核验', description: '核验渠道资质文件有效性' },
  { key: ChannelAuditStage.PERMISSION_ACTIVATE, label: '权限开通', description: '开通渠道合作权限' },
] as const;

export enum ChannelLevel {
  STAR = 'STAR',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

export const CHANNEL_LEVEL_ORDER: ChannelLevel[] = [
  ChannelLevel.STAR,
  ChannelLevel.BRONZE,
  ChannelLevel.SILVER,
  ChannelLevel.GOLD,
  ChannelLevel.PLATINUM,
  ChannelLevel.DIAMOND,
];

export const CHANNEL_LEVEL_LABELS: Record<ChannelLevel, { label: string; type: 'info' | 'primary' | 'success' | 'warning' | 'danger' }> = {
  [ChannelLevel.STAR]: { label: '星级渠道', type: 'info' },
  [ChannelLevel.BRONZE]: { label: '铜牌渠道', type: 'primary' },
  [ChannelLevel.SILVER]: { label: '银牌渠道', type: 'success' },
  [ChannelLevel.GOLD]: { label: '金牌渠道', type: 'warning' },
  [ChannelLevel.PLATINUM]: { label: '铂金渠道', type: 'danger' },
  [ChannelLevel.DIAMOND]: { label: '钻石渠道', type: 'danger' },
};

export interface ChannelLevelThreshold {
  minMonthlyAmount: number;
  minMonthlyOrders: number;
  minCooperationMonths: number;
  minFulfillmentRate: number;
  minPromotionScore: number;
}

export interface ChannelLevelBenefits {
  commissionRateBonus: number;
  resourceSupportLevel: number;
  canExclusiveActivity: boolean;
  canCustomSettle: boolean;
  prioritySupport: boolean;
  dedicatedManager: boolean;
}

export const CHANNEL_LEVEL_CONFIGS: Array<{
  level: ChannelLevel;
  threshold: ChannelLevelThreshold;
  benefits: ChannelLevelBenefits;
}> = [
  {
    level: ChannelLevel.STAR,
    threshold: {
      minMonthlyAmount: 0,
      minMonthlyOrders: 0,
      minCooperationMonths: 0,
      minFulfillmentRate: 0,
      minPromotionScore: 0,
    },
    benefits: {
      commissionRateBonus: 0,
      resourceSupportLevel: 1,
      canExclusiveActivity: false,
      canCustomSettle: false,
      prioritySupport: false,
      dedicatedManager: false,
    },
  },
  {
    level: ChannelLevel.BRONZE,
    threshold: {
      minMonthlyAmount: 10000,
      minMonthlyOrders: 30,
      minCooperationMonths: 1,
      minFulfillmentRate: 80,
      minPromotionScore: 60,
    },
    benefits: {
      commissionRateBonus: 0.02,
      resourceSupportLevel: 2,
      canExclusiveActivity: false,
      canCustomSettle: false,
      prioritySupport: false,
      dedicatedManager: false,
    },
  },
  {
    level: ChannelLevel.SILVER,
    threshold: {
      minMonthlyAmount: 50000,
      minMonthlyOrders: 150,
      minCooperationMonths: 3,
      minFulfillmentRate: 85,
      minPromotionScore: 70,
    },
    benefits: {
      commissionRateBonus: 0.05,
      resourceSupportLevel: 3,
      canExclusiveActivity: true,
      canCustomSettle: false,
      prioritySupport: true,
      dedicatedManager: false,
    },
  },
  {
    level: ChannelLevel.GOLD,
    threshold: {
      minMonthlyAmount: 200000,
      minMonthlyOrders: 600,
      minCooperationMonths: 6,
      minFulfillmentRate: 90,
      minPromotionScore: 80,
    },
    benefits: {
      commissionRateBonus: 0.08,
      resourceSupportLevel: 4,
      canExclusiveActivity: true,
      canCustomSettle: true,
      prioritySupport: true,
      dedicatedManager: true,
    },
  },
  {
    level: ChannelLevel.PLATINUM,
    threshold: {
      minMonthlyAmount: 500000,
      minMonthlyOrders: 1500,
      minCooperationMonths: 12,
      minFulfillmentRate: 95,
      minPromotionScore: 90,
    },
    benefits: {
      commissionRateBonus: 0.12,
      resourceSupportLevel: 5,
      canExclusiveActivity: true,
      canCustomSettle: true,
      prioritySupport: true,
      dedicatedManager: true,
    },
  },
  {
    level: ChannelLevel.DIAMOND,
    threshold: {
      minMonthlyAmount: 2000000,
      minMonthlyOrders: 5000,
      minCooperationMonths: 24,
      minFulfillmentRate: 98,
      minPromotionScore: 95,
    },
    benefits: {
      commissionRateBonus: 0.18,
      resourceSupportLevel: 6,
      canExclusiveActivity: true,
      canCustomSettle: true,
      prioritySupport: true,
      dedicatedManager: true,
    },
  },
];

export enum ChannelLevelChangeSource {
  AUTO_EVALUATE = 'auto_evaluate',
  MANUAL_ADJUST = 'manual_adjust',
  BATCH_ADJUST = 'batch_adjust',
  RULE_CHANGE = 'rule_change',
}

export const CHANNEL_LEVEL_CHANGE_SOURCE_LABELS: Record<ChannelLevelChangeSource, string> = {
  [ChannelLevelChangeSource.AUTO_EVALUATE]: '系统自动评级',
  [ChannelLevelChangeSource.MANUAL_ADJUST]: '人工手动调整',
  [ChannelLevelChangeSource.BATCH_ADJUST]: '批量调整',
  [ChannelLevelChangeSource.RULE_CHANGE]: '分级规则变更触发',
};

export enum ChannelLevelAdjustStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = -1,
}

export const CHANNEL_LEVEL_ADJUST_STATUS_LABELS: Record<ChannelLevelAdjustStatus, { label: string; type: 'info' | 'warning' | 'success' | 'danger' }> = {
  [ChannelLevelAdjustStatus.PENDING]: { label: '待审批', type: 'warning' },
  [ChannelLevelAdjustStatus.APPROVED]: { label: '已通过', type: 'success' },
  [ChannelLevelAdjustStatus.REJECTED]: { label: '已拒绝', type: 'danger' },
};

export enum ResourceSupportLevel {
  NONE = 0,
  BASIC = 1,
  STANDARD = 2,
  ENHANCED = 3,
  PREMIUM = 4,
  VIP = 5,
  CUSTOM = 6,
}

export const RESOURCE_SUPPORT_LEVEL_LABELS: Record<ResourceSupportLevel, string> = {
  [ResourceSupportLevel.NONE]: '无',
  [ResourceSupportLevel.BASIC]: '基础扶持',
  [ResourceSupportLevel.STANDARD]: '标准扶持',
  [ResourceSupportLevel.ENHANCED]: '增强扶持',
  [ResourceSupportLevel.PREMIUM]: '优质扶持',
  [ResourceSupportLevel.VIP]: 'VIP专属',
  [ResourceSupportLevel.CUSTOM]: '定制化扶持',
};

export enum ProductStatus {
  DRAFT = 0,
  PENDING_AUDIT = 1,
  AUDIT_PASSED = 2,
  AUDIT_REJECTED = -1,
  LISTED = 3,
  DELISTED = 4,
  OFFLINE = -2,
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, { label: string; type: 'info' | 'warning' | 'success' | 'danger' }> = {
  [ProductStatus.DRAFT]: { label: '草稿', type: 'info' },
  [ProductStatus.PENDING_AUDIT]: { label: '待审核', type: 'warning' },
  [ProductStatus.AUDIT_PASSED]: { label: '审核通过', type: 'success' },
  [ProductStatus.AUDIT_REJECTED]: { label: '审核驳回', type: 'danger' },
  [ProductStatus.LISTED]: { label: '已上架', type: 'success' },
  [ProductStatus.DELISTED]: { label: '已下架', type: 'info' },
  [ProductStatus.OFFLINE]: { label: '已下线', type: 'danger' },
};

export enum ProductAuditStage {
  PENDING_SUBMIT = 0,
  QUALIFICATION_AUDIT = 1,
  PRICE_AUDIT = 2,
  COMMISSION_AUDIT = 3,
  COMPLETED = 4,
  REJECTED = -1,
}

export enum ProductAuditAction {
  SUBMIT = 'submit',
  QUALIFICATION_PASS = 'qualification_pass',
  QUALIFICATION_REJECT = 'qualification_reject',
  PRICE_PASS = 'price_pass',
  PRICE_REJECT = 'price_reject',
  COMMISSION_PASS = 'commission_pass',
  COMMISSION_REJECT = 'commission_reject',
  LIST = 'list',
  DELIST = 'delist',
  OFFLINE = 'offline',
  EDIT = 'edit',
  EDIT_CORE = 'edit_core',
  EDIT_APPROVE = 'edit_approve',
  EDIT_REJECT = 'edit_reject',
  BATCH_EDIT = 'batch_edit',
  COMMISSION_ADJUST = 'commission_adjust',
  FORCE_DELIST = 'force_delist',
  SCHEDULE_LIST = 'schedule_list',
  SCHEDULE_DELIST = 'schedule_delist',
  BATCH_LIST = 'batch_list',
  BATCH_DELIST = 'batch_delist',
}

export enum ProductEditApprovalStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = -1,
  CANCELLED = 2,
}

export const PRODUCT_EDIT_APPROVAL_STATUS_LABELS: Record<ProductEditApprovalStatus, { label: string; type: 'warning' | 'success' | 'danger' | 'info' }> = {
  [ProductEditApprovalStatus.PENDING]: { label: '待审批', type: 'warning' },
  [ProductEditApprovalStatus.APPROVED]: { label: '已通过', type: 'success' },
  [ProductEditApprovalStatus.REJECTED]: { label: '已驳回', type: 'danger' },
  [ProductEditApprovalStatus.CANCELLED]: { label: '已撤销', type: 'info' },
};

export const PRODUCT_CORE_FIELDS: string[] = [
  'originalPrice',
  'salePrice',
  'costPrice',
  'commissionRate',
  'minCommission',
  'maxCommission',
];

export const PRODUCT_CORE_FIELD_LABELS: Record<string, string> = {
  originalPrice: '商品原价',
  salePrice: '销售价格',
  costPrice: '成本价格',
  commissionRate: '佣金比例',
  minCommission: '最低佣金',
  maxCommission: '最高佣金',
};

export const PRODUCT_NON_CORE_FIELDS: string[] = [
  'name',
  'description',
  'brand',
  'mainImage',
  'images',
  'promotionMaterials',
  'remark',
  'isHot',
  'isRecommended',
  'sort',
  'tags',
];

export const PRODUCT_BATCH_EDIT_FIELDS: string[] = [
  'isHot',
  'isRecommended',
  'sort',
  'tags',
  'promotionWeight',
];

export const PRODUCT_BATCH_EDIT_FIELD_LABELS: Record<string, string> = {
  isHot: '热销标记',
  isRecommended: '推荐状态',
  sort: '展示排序',
  tags: '商品标签',
  promotionWeight: '推广权重',
};

export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  FOOD = 'food',
  BEAUTY = 'beauty',
  HOME = 'home',
  SPORTS = 'sports',
  BOOKS = 'books',
  TOYS = 'toys',
  OTHER = 'other',
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.ELECTRONICS]: '数码电子',
  [ProductCategory.CLOTHING]: '服饰鞋包',
  [ProductCategory.FOOD]: '食品生鲜',
  [ProductCategory.BEAUTY]: '美妆个护',
  [ProductCategory.HOME]: '家居日用',
  [ProductCategory.SPORTS]: '运动户外',
  [ProductCategory.BOOKS]: '图书文娱',
  [ProductCategory.TOYS]: '母婴玩具',
  [ProductCategory.OTHER]: '其他',
};

export const PRODUCT_CATEGORY_COMMISSION_RANGES: Record<ProductCategory, { min: number; max: number; warning: number }> = {
  [ProductCategory.ELECTRONICS]: { min: 0.02, max: 0.15, warning: 0.12 },
  [ProductCategory.CLOTHING]: { min: 0.05, max: 0.30, warning: 0.25 },
  [ProductCategory.FOOD]: { min: 0.03, max: 0.20, warning: 0.15 },
  [ProductCategory.BEAUTY]: { min: 0.08, max: 0.40, warning: 0.35 },
  [ProductCategory.HOME]: { min: 0.05, max: 0.25, warning: 0.20 },
  [ProductCategory.SPORTS]: { min: 0.05, max: 0.25, warning: 0.20 },
  [ProductCategory.BOOKS]: { min: 0.05, max: 0.20, warning: 0.15 },
  [ProductCategory.TOYS]: { min: 0.08, max: 0.30, warning: 0.25 },
  [ProductCategory.OTHER]: { min: 0.05, max: 0.25, warning: 0.20 },
};

export const PRODUCT_CATEGORY_PROMOTION_WEIGHT_DEFAULTS: Record<ProductCategory, number> = {
  [ProductCategory.ELECTRONICS]: 80,
  [ProductCategory.CLOTHING]: 90,
  [ProductCategory.FOOD]: 85,
  [ProductCategory.BEAUTY]: 95,
  [ProductCategory.HOME]: 75,
  [ProductCategory.SPORTS]: 70,
  [ProductCategory.BOOKS]: 65,
  [ProductCategory.TOYS]: 85,
  [ProductCategory.OTHER]: 60,
};

export const PRODUCT_AUDIT_STAGES = [
  { key: ProductAuditStage.QUALIFICATION_AUDIT, label: '资质审核', description: '审核商品资质文件有效性' },
  { key: ProductAuditStage.PRICE_AUDIT, label: '价格审核', description: '审核商品价格体系合理性' },
  { key: ProductAuditStage.COMMISSION_AUDIT, label: '佣金审核', description: '审核分销佣金比例合规性' },
] as const;

export enum ProductRejectIssueType {
  MISSING_QUALIFICATION = 'missing_qualification',
  INVALID_QUALIFICATION = 'invalid_qualification',
  UNREASONABLE_PRICE = 'unreasonable_price',
  INVALID_INVENTORY = 'invalid_inventory',
  ABNORMAL_COMMISSION = 'abnormal_commission',
  DUPLICATE_PRODUCT = 'duplicate_product',
  FAKE_PRODUCT = 'fake_product',
  OTHER = 'other',
}

export const PRODUCT_REJECT_ISSUE_LABELS: Record<ProductRejectIssueType, string> = {
  missing_qualification: '资质缺失',
  invalid_qualification: '资质无效或过期',
  unreasonable_price: '价格体系不合理',
  invalid_inventory: '库存信息异常',
  abnormal_commission: '佣金比例异常',
  duplicate_product: '重复商品',
  fake_product: '虚假商品',
  other: '其他问题',
};

export interface ProductMaterial {
  type: 'image' | 'video' | 'text';
  url?: string;
  content?: string;
  title?: string;
}

export const DEFAULT_PRODUCT_MATERIALS: Record<ProductCategory, ProductMaterial[]> = {
  [ProductCategory.ELECTRONICS]: [
    { type: 'text', title: '产品卖点', content: '正品保障·全国联保·极速发货' },
    { type: 'text', title: '推荐文案', content: '给大家推荐这款超好用的数码产品，性价比超高！' },
  ],
  [ProductCategory.CLOTHING]: [
    { type: 'text', title: '产品卖点', content: '品质面料·舒适亲肤·潮流款式' },
    { type: 'text', title: '推荐文案', content: '这件衣服真的太好看了，穿上超有气质！' },
  ],
  [ProductCategory.FOOD]: [
    { type: 'text', title: '产品卖点', content: '新鲜直供·品质保证·美味可口' },
    { type: 'text', title: '推荐文案', content: '吃货必入！这款美食真的绝了，吃过还想吃~' },
  ],
  [ProductCategory.BEAUTY]: [
    { type: 'text', title: '产品卖点', content: '正品保障·温和不刺激·好评如潮' },
    { type: 'text', title: '推荐文案', content: '护肤好物分享，用完皮肤真的变好了！' },
  ],
  [ProductCategory.HOME]: [
    { type: 'text', title: '产品卖点', content: '品质生活·实用好物·居家必备' },
    { type: 'text', title: '推荐文案', content: '居家好物推荐，用过都说好！' },
  ],
  [ProductCategory.SPORTS]: [
    { type: 'text', title: '产品卖点', content: '专业品质·运动必备·舒适体验' },
    { type: 'text', title: '推荐文案', content: '运动爱好者的福音，这款装备太赞了！' },
  ],
  [ProductCategory.BOOKS]: [
    { type: 'text', title: '产品卖点', content: '正版书籍·知识宝库·成长必读' },
    { type: 'text', title: '推荐文案', content: '这本书真的改变了我，强烈推荐！' },
  ],
  [ProductCategory.TOYS]: [
    { type: 'text', title: '产品卖点', content: '安全材质·益智有趣·孩子最爱' },
    { type: 'text', title: '推荐文案', content: '宝妈必入！宝宝玩得开心，妈妈放心~' },
  ],
  [ProductCategory.OTHER]: [
    { type: 'text', title: '产品卖点', content: '品质保障·值得信赖' },
    { type: 'text', title: '推荐文案', content: '好物分享，真心推荐给大家！' },
  ],
};

export const PRODUCT_QUALIFICATION_REQUIRED: ProductCategory[] = [
  ProductCategory.ELECTRONICS,
  ProductCategory.FOOD,
  ProductCategory.BEAUTY,
];

export const PRODUCT_IMPORT_TEMPLATE_FIELDS = [
  { key: 'name', label: '商品名称', required: true },
  { key: 'sku', label: '商品SKU', required: true },
  { key: 'category', label: '商品分类', required: true },
  { key: 'originalPrice', label: '原价', required: true },
  { key: 'salePrice', label: '销售价', required: true },
  { key: 'stock', label: '库存数量', required: true },
  { key: 'commissionRate', label: '佣金比例', required: true },
  { key: 'description', label: '商品描述', required: false },
  { key: 'brand', label: '品牌', required: false },
] as const;

export enum ProductScheduleRuleStatus {
  PENDING = 0,
  ACTIVE = 1,
  EXECUTED = 2,
  CANCELLED = 3,
  EXPIRED = 4,
}

export const PRODUCT_SCHEDULE_RULE_STATUS_LABELS: Record<ProductScheduleRuleStatus, { label: string; type: 'info' | 'warning' | 'success' | 'danger' }> = {
  [ProductScheduleRuleStatus.PENDING]: { label: '待生效', type: 'info' },
  [ProductScheduleRuleStatus.ACTIVE]: { label: '生效中', type: 'warning' },
  [ProductScheduleRuleStatus.EXECUTED]: { label: '已执行', type: 'success' },
  [ProductScheduleRuleStatus.CANCELLED]: { label: '已取消', type: 'danger' },
  [ProductScheduleRuleStatus.EXPIRED]: { label: '已过期', type: 'info' },
};

export enum ProductScheduleRuleAction {
  LIST = 'list',
  DELIST = 'delist',
}

export const PRODUCT_SCHEDULE_RULE_ACTION_LABELS: Record<ProductScheduleRuleAction, string> = {
  [ProductScheduleRuleAction.LIST]: '定时上架',
  [ProductScheduleRuleAction.DELIST]: '定时下架',
};

export enum ProductScheduleRepeatCycle {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export const PRODUCT_SCHEDULE_REPEAT_CYCLE_LABELS: Record<ProductScheduleRepeatCycle, string> = {
  [ProductScheduleRepeatCycle.NONE]: '不重复',
  [ProductScheduleRepeatCycle.DAILY]: '每天',
  [ProductScheduleRepeatCycle.WEEKLY]: '每周',
  [ProductScheduleRepeatCycle.MONTHLY]: '每月',
};

export enum ProductListingTrigger {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  VIOLATION = 'violation',
  BATCH = 'batch',
  AUTO_EXPIRED = 'auto_expired',
  AUTO_ORDER_COMPLETE = 'auto_order_complete',
}

export const PRODUCT_LISTING_TRIGGER_LABELS: Record<ProductListingTrigger, string> = {
  [ProductListingTrigger.MANUAL]: '手动操作',
  [ProductListingTrigger.SCHEDULED]: '定时任务',
  [ProductListingTrigger.VIOLATION]: '违规下架',
  [ProductListingTrigger.BATCH]: '批量操作',
  [ProductListingTrigger.AUTO_EXPIRED]: '到期自动下架',
  [ProductListingTrigger.AUTO_ORDER_COMPLETE]: '订单完结自动下架',
};

export enum ProductListingAction {
  LIST = 'list',
  DELIST = 'delist',
  FORCE_DELIST = 'force_delist',
}

export const PRODUCT_LISTING_ACTION_LABELS: Record<ProductListingAction, string> = {
  [ProductListingAction.LIST]: '上架',
  [ProductListingAction.DELIST]: '下架',
  [ProductListingAction.FORCE_DELIST]: '强制下架',
};

export const PRODUCT_FREQUENT_LISTING_THRESHOLD = 5;
export const PRODUCT_FREQUENT_LISTING_WINDOW_DAYS = 7;
export const PRODUCT_HOT_SALES_THRESHOLD = 100;

export enum ProductRiskStatus {
  NORMAL = 0,
  WARNING = 1,
  SUSPENDED = 2,
  BANNED = 3,
  REVIEWING = 4,
}

export const PRODUCT_RISK_STATUS_LABELS: Record<ProductRiskStatus, { label: string; type: 'info' | 'warning' | 'danger' | 'success' }> = {
  [ProductRiskStatus.NORMAL]: { label: '正常', type: 'success' },
  [ProductRiskStatus.WARNING]: { label: '预警', type: 'warning' },
  [ProductRiskStatus.SUSPENDED]: { label: '推广暂停', type: 'danger' },
  [ProductRiskStatus.BANNED]: { label: '永久封禁', type: 'danger' },
  [ProductRiskStatus.REVIEWING]: { label: '复核中', type: 'warning' },
};

export enum ProductRiskType {
  DAILY_PROMOTION_EXCEEDED = 'daily_promotion_exceeded',
  SINGLE_COMMISSION_EXCEEDED = 'single_commission_exceeded',
  HIGH_FREQUENCY_PROMOTION = 'high_frequency_promotion',
  VIOLATION_PROMOTION = 'violation_promotion',
  FAKE_TRANSACTION = 'fake_transaction',
  PRICE_ABNORMAL = 'price_abnormal',
  SUSPICIOUS_ORDER = 'suspicious_order',
  OTHER = 'other',
}

export const PRODUCT_RISK_TYPE_LABELS: Record<ProductRiskType, string> = {
  [ProductRiskType.DAILY_PROMOTION_EXCEEDED]: '单日推广量超限',
  [ProductRiskType.SINGLE_COMMISSION_EXCEEDED]: '单笔佣金超限',
  [ProductRiskType.HIGH_FREQUENCY_PROMOTION]: '高频推广',
  [ProductRiskType.VIOLATION_PROMOTION]: '违规推广',
  [ProductRiskType.FAKE_TRANSACTION]: '虚假交易',
  [ProductRiskType.PRICE_ABNORMAL]: '价格异常',
  [ProductRiskType.SUSPICIOUS_ORDER]: '可疑订单',
  [ProductRiskType.OTHER]: '其他',
};

export enum ProductRiskTrigger {
  AUTO = 'auto',
  MANUAL = 'manual',
  BATCH = 'batch',
  SYSTEM = 'system',
}

export const PRODUCT_RISK_TRIGGER_LABELS: Record<ProductRiskTrigger, string> = {
  [ProductRiskTrigger.AUTO]: '系统自动',
  [ProductRiskTrigger.MANUAL]: '人工标记',
  [ProductRiskTrigger.BATCH]: '批量操作',
  [ProductRiskTrigger.SYSTEM]: '系统检测',
};

export enum ProductRiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const PRODUCT_RISK_SEVERITY_LABELS: Record<ProductRiskSeverity, string> = {
  [ProductRiskSeverity.LOW]: '低',
  [ProductRiskSeverity.MEDIUM]: '中',
  [ProductRiskSeverity.HIGH]: '高',
  [ProductRiskSeverity.CRITICAL]: '严重',
};

export enum ProductRiskAction {
  SUSPEND_PROMOTION = 'suspend_promotion',
  BAN_PERMANENTLY = 'ban_permanently',
  ORDER_REVIEW = 'order_review',
  COMMISSION_FREEZE = 'commission_freeze',
  WARNING_NOTICE = 'warning_notice',
  RESTORE_NORMAL = 'restore_normal',
  FALSE_ALARM = 'false_alarm',
}

export const PRODUCT_RISK_ACTION_LABELS: Record<ProductRiskAction, string> = {
  [ProductRiskAction.SUSPEND_PROMOTION]: '暂停推广',
  [ProductRiskAction.BAN_PERMANENTLY]: '永久封禁',
  [ProductRiskAction.ORDER_REVIEW]: '订单复核',
  [ProductRiskAction.COMMISSION_FREEZE]: '佣金冻结',
  [ProductRiskAction.WARNING_NOTICE]: '预警通知',
  [ProductRiskAction.RESTORE_NORMAL]: '恢复正常',
  [ProductRiskAction.FALSE_ALARM]: '误风控解除',
};

export const DEFAULT_PRODUCT_RISK_RULES = {
  dailyMaxPromotionCount: 1000,
  singleMaxCommission: 500,
  highFrequencyThreshold: 100,
  highFrequencyWindowMinutes: 10,
  dailyMaxSuspiciousOrderRatio: 0.1,
  priceAbnormalDeviationRate: 0.3,
};

export const PRODUCT_RISK_RESET_HOUR = 0;
export const PRODUCT_RISK_FALSE_ALARM_THRESHOLD = 3;
export const PRODUCT_RISK_DUPLICATE_CHECK_WINDOW_MINUTES = 30;

export enum OrderAbnormalType {
  FAKE_ORDER = 'fake_order',
  BRUSH_ORDER = 'brush_order',
  TIMEOUT_UNPAID = 'timeout_unpaid',
  REFUND_ABNORMAL = 'refund_abnormal',
  DATA_MISMATCH = 'data_mismatch',
  ABNORMAL_DEVICE = 'abnormal_device',
  ABNORMAL_IP = 'abnormal_ip',
  REPEAT_PURCHASE = 'repeat_purchase',
  OTHER = 'other',
}

export const ORDER_ABNORMAL_TYPE_LABELS: Record<OrderAbnormalType, { label: string; type: 'warning' | 'danger' | 'info' | 'primary' }> = {
  fake_order: { label: '虚假订单', type: 'danger' },
  brush_order: { label: '刷单订单', type: 'danger' },
  timeout_unpaid: { label: '超时未付款', type: 'warning' },
  refund_abnormal: { label: '退款异常', type: 'danger' },
  data_mismatch: { label: '数据不匹配', type: 'warning' },
  abnormal_device: { label: '设备异常', type: 'warning' },
  abnormal_ip: { label: 'IP异常', type: 'warning' },
  repeat_purchase: { label: '重复购买', type: 'info' },
  other: { label: '其他异常', type: 'primary' },
};

export enum OrderAbnormalSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const ORDER_ABNORMAL_SEVERITY_LABELS: Record<OrderAbnormalSeverity, { label: string; color: string }> = {
  low: { label: '低风险', color: '#909399' },
  medium: { label: '中风险', color: '#e6a23c' },
  high: { label: '高风险', color: '#f56c6c' },
  critical: { label: '严重风险', color: '#c0392b' },
};

export enum OrderAbnormalStatus {
  PENDING_REVIEW = 0,
  REVIEWING = 1,
  RESOLVED = 2,
  REJECTED = 3,
}

export const ORDER_ABNORMAL_STATUS_LABELS: Record<OrderAbnormalStatus, { label: string; type: 'warning' | 'primary' | 'success' | 'info' | 'danger' }> = {
  [OrderAbnormalStatus.PENDING_REVIEW]: { label: '待复核', type: 'warning' },
  [OrderAbnormalStatus.REVIEWING]: { label: '复核中', type: 'primary' },
  [OrderAbnormalStatus.RESOLVED]: { label: '已处理', type: 'success' },
  [OrderAbnormalStatus.REJECTED]: { label: '已驳回', type: 'info' },
};

export enum OrderAbnormalReviewAction {
  RELEASE = 'release',
  REJECT = 'reject',
  OBSERVE = 'observe',
}

export const ORDER_ABNORMAL_REVIEW_ACTION_LABELS: Record<OrderAbnormalReviewAction, { label: string; type: 'success' | 'danger' | 'warning' }> = {
  release: { label: '放行结算', type: 'success' },
  reject: { label: '驳回作废', type: 'danger' },
  observe: { label: '暂停观测', type: 'warning' },
};

export enum OrderAbnormalSource {
  SYSTEM_AUTO = 'system_auto',
  RULE_ENGINE = 'rule_engine',
  MANUAL_MARK = 'manual_mark',
  BATCH_IMPORT = 'batch_import',
  THIRD_PARTY = 'third_party',
}

export const ORDER_ABNORMAL_SOURCE_LABELS: Record<OrderAbnormalSource, string> = {
  system_auto: '系统自动识别',
  rule_engine: '规则引擎触发',
  manual_mark: '人工手动标记',
  batch_import: '批量导入',
  third_party: '第三方数据源',
};

export const ORDER_ABNORMAL_DETECTION_RULES = {
  timeoutUnpaidMinutes: 30,
  brushOrderSameIpCount: 5,
  brushOrderSameDeviceCount: 5,
  brushOrderSameUserWindowMinutes: 60,
  brushOrderSameUserCount: 10,
  refundAbnormalRateThreshold: 0.3,
  refundAbnormalMinOrders: 5,
  repeatPurchaseSameSkuHours: 24,
  repeatPurchaseSameSkuCount: 3,
  dataMismatchToleranceRate: 0.05,
  abnormalIpBlacklistCheck: true,
  abnormalDeviceFingerprintCheck: true,
} as const;

export interface AbnormalEvidenceItem {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
}

export interface AbnormalRootCause {
  category: 'promoter' | 'channel' | 'system' | 'user' | 'product' | 'other';
  description: string;
  relatedIds?: string[];
  confidence: number;
}
