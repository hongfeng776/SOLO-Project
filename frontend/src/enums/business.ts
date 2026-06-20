export enum NoteStatus {
  DRAFT = 0,
  PENDING_REVIEW = 1,
  PUBLISHED = 2,
  REJECTED = 3,
  OFF_SHELF = 4,
  SCHEDULED = 5,
  POSTPONED = 6,
  FLOW_LIMITED = 7
}

export enum NoteType {
  IMAGE_TEXT = 1,
  VIDEO = 2
}

export const NOTE_STATUS_NAMES: Record<number, string> = {
  [NoteStatus.DRAFT]: '草稿',
  [NoteStatus.PENDING_REVIEW]: '待审核',
  [NoteStatus.PUBLISHED]: '已发布',
  [NoteStatus.REJECTED]: '已拒绝',
  [NoteStatus.OFF_SHELF]: '已下架',
  [NoteStatus.SCHEDULED]: '定时待发布',
  [NoteStatus.POSTPONED]: '暂缓审核',
  [NoteStatus.FLOW_LIMITED]: '限流'
}

export const NOTE_TYPE_NAMES: Record<number, string> = {
  [NoteType.IMAGE_TEXT]: '图文',
  [NoteType.VIDEO]: '视频'
}

export enum ReviewerLevel {
  NONE = 0,
  NORMAL = 1,
  SENIOR = 2
}

export enum FlowUnlockedStatus {
  LOCKED = 0,
  UNLOCKED = 1
}

export enum RegisterSource {
  MANUAL = 'manual',
  WECHAT = 'wechat',
  QQ = 'qq',
  APPLE = 'apple',
  PHONE = 'phone',
  IMPORT = 'import'
}

export const REGISTER_SOURCE_NAMES: Record<string, string> = {
  [RegisterSource.MANUAL]: '手动注册',
  [RegisterSource.WECHAT]: '微信',
  [RegisterSource.QQ]: 'QQ',
  [RegisterSource.APPLE]: '苹果',
  [RegisterSource.PHONE]: '手机号',
  [RegisterSource.IMPORT]: '批量导入'
}

export enum RealNameStatus {
  UNVERIFIED = 0,
  PENDING = 1,
  VERIFIED = 2,
  REJECTED = 3
}

export const REAL_NAME_STATUS_NAMES: Record<number, string> = {
  [RealNameStatus.UNVERIFIED]: '未认证',
  [RealNameStatus.PENDING]: '审核中',
  [RealNameStatus.VERIFIED]: '已认证',
  [RealNameStatus.REJECTED]: '已拒绝'
}

export enum UserAbnormalType {
  FAKE_INFO = 'fake_info',
  DUPLICATE_BINDING = 'duplicate_binding',
  INCOMPLETE_INFO = 'incomplete_info',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ABNORMAL_DEVICE = 'abnormal_device'
}

export const USER_ABNORMAL_TYPE_NAMES: Record<string, string> = {
  [UserAbnormalType.FAKE_INFO]: '虚假信息',
  [UserAbnormalType.DUPLICATE_BINDING]: '重复绑定',
  [UserAbnormalType.INCOMPLETE_INFO]: '信息不完整',
  [UserAbnormalType.SUSPICIOUS_ACTIVITY]: '可疑行为',
  [UserAbnormalType.ABNORMAL_DEVICE]: '设备异常'
}

export enum UserFilterType {
  NEW_REGISTERED = 'new_registered',
  NOT_VERIFIED = 'not_verified',
  LOW_ACTIVITY = 'low_activity',
  NO_PHONE = 'no_phone',
  ABNORMAL = 'abnormal'
}

export const USER_FILTER_TYPE_NAMES: Record<string, string> = {
  [UserFilterType.NEW_REGISTERED]: '新注册',
  [UserFilterType.NOT_VERIFIED]: '未实名',
  [UserFilterType.LOW_ACTIVITY]: '低活跃',
  [UserFilterType.NO_PHONE]: '未绑定手机',
  [UserFilterType.ABNORMAL]: '异常用户'
}

export enum BatchOperationScope {
  SELECTED = 'selected',
  FILTERED = 'filtered',
  ALL = 'all'
}

export const BATCH_OPERATION_SCOPE_NAMES: Record<string, string> = {
  [BatchOperationScope.SELECTED]: '选中用户',
  [BatchOperationScope.FILTERED]: '筛选结果',
  [BatchOperationScope.ALL]: '全部用户'
}

export enum UserAccountLogType {
  INFO_UPDATE = 'info_update',
  NICKNAME_CHANGE = 'nickname_change',
  AVATAR_CHANGE = 'avatar_change',
  PHONE_CHANGE = 'phone_change',
  BATCH_UPDATE = 'batch_update',
  BATCH_RESET = 'batch_reset'
}

export const USER_ACCOUNT_LOG_TYPE_NAMES: Record<string, string> = {
  [UserAccountLogType.INFO_UPDATE]: '信息更新',
  [UserAccountLogType.NICKNAME_CHANGE]: '昵称修改',
  [UserAccountLogType.AVATAR_CHANGE]: '头像修改',
  [UserAccountLogType.PHONE_CHANGE]: '手机号修改',
  [UserAccountLogType.BATCH_UPDATE]: '批量更新',
  [UserAccountLogType.BATCH_RESET]: '批量重置'
}

export enum UserLevel {
  RESTRICTED = -1,
  NORMAL = 0,
  ACTIVE = 1,
  PREMIUM = 2
}

export const USER_LEVEL_NAMES: Record<number, string> = {
  [UserLevel.RESTRICTED]: '受限',
  [UserLevel.NORMAL]: '普通',
  [UserLevel.ACTIVE]: '活跃',
  [UserLevel.PREMIUM]: '优质'
}

export const USER_LEVEL_COLORS: Record<number, string> = {
  [UserLevel.RESTRICTED]: '#f56c6c',
  [UserLevel.NORMAL]: '#909399',
  [UserLevel.ACTIVE]: '#409eff',
  [UserLevel.PREMIUM]: '#e6a23c'
}

export enum UserBenefit {
  PRIORITY_REVIEW = 'priority_review',
  FLOW_BOOST = 'flow_boost',
  UNLIMITED_PUBLISH = 'unlimited_publish',
  COMMENT_PRIVILEGE = 'comment_privilege',
  DM_PRIVILEGE = 'dm_privilege',
  CUSTOM_AVATAR = 'custom_avatar',
  VERIFIED_BADGE = 'verified_badge',
  ANALYTICS_ACCESS = 'analytics_access'
}

export const USER_BENEFIT_NAMES: Record<string, string> = {
  [UserBenefit.PRIORITY_REVIEW]: '优先审核',
  [UserBenefit.FLOW_BOOST]: '流量倾斜',
  [UserBenefit.UNLIMITED_PUBLISH]: '无限制发布',
  [UserBenefit.COMMENT_PRIVILEGE]: '评论特权',
  [UserBenefit.DM_PRIVILEGE]: '私信特权',
  [UserBenefit.CUSTOM_AVATAR]: '自定义头像框',
  [UserBenefit.VERIFIED_BADGE]: '认证标识',
  [UserBenefit.ANALYTICS_ACCESS]: '数据分析'
}

export const USER_LEVEL_BENEFITS: Record<number, string[]> = {
  [UserLevel.RESTRICTED]: [],
  [UserLevel.NORMAL]: [UserBenefit.COMMENT_PRIVILEGE],
  [UserLevel.ACTIVE]: [UserBenefit.COMMENT_PRIVILEGE, UserBenefit.DM_PRIVILEGE, UserBenefit.UNLIMITED_PUBLISH],
  [UserLevel.PREMIUM]: [
    UserBenefit.PRIORITY_REVIEW,
    UserBenefit.FLOW_BOOST,
    UserBenefit.UNLIMITED_PUBLISH,
    UserBenefit.COMMENT_PRIVILEGE,
    UserBenefit.DM_PRIVILEGE,
    UserBenefit.CUSTOM_AVATAR,
    UserBenefit.VERIFIED_BADGE,
    UserBenefit.ANALYTICS_ACCESS
  ]
}

export enum LevelAdjustReason {
  AUTO_CALCULATE = 'auto_calculate',
  MANUAL_UPGRADE = 'manual_upgrade',
  MANUAL_DOWNGRADE = 'manual_downgrade',
  VIOLATION_PENALTY = 'violation_penalty',
  COMPLIANCE_REWARD = 'compliance_reward',
  BATCH_OPERATION = 'batch_operation',
  SYSTEM_ADJUSTMENT = 'system_adjustment'
}

export const LEVEL_ADJUST_REASON_NAMES: Record<string, string> = {
  [LevelAdjustReason.AUTO_CALCULATE]: '自动计算',
  [LevelAdjustReason.MANUAL_UPGRADE]: '手动升级',
  [LevelAdjustReason.MANUAL_DOWNGRADE]: '手动降级',
  [LevelAdjustReason.VIOLATION_PENALTY]: '违规处罚',
  [LevelAdjustReason.COMPLIANCE_REWARD]: '合规奖励',
  [LevelAdjustReason.BATCH_OPERATION]: '批量操作',
  [LevelAdjustReason.SYSTEM_ADJUSTMENT]: '系统调整'
}

export enum AdjustOperationType {
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  SET = 'set'
}

export const ADJUST_OPERATION_TYPE_NAMES: Record<string, string> = {
  [AdjustOperationType.UPGRADE]: '升级',
  [AdjustOperationType.DOWNGRADE]: '降级',
  [AdjustOperationType.SET]: '直接设置'
}

export enum LevelScoreFactor {
  ACTIVITY = 'activity',
  CONTENT_QUALITY = 'content_quality',
  COMPLIANCE = 'compliance',
  ACCOUNT_AGE = 'account_age',
  REAL_NAME = 'real_name',
  PHONE_VERIFIED = 'phone_verified'
}

export const LEVEL_SCORE_FACTOR_NAMES: Record<string, string> = {
  [LevelScoreFactor.ACTIVITY]: '活跃度',
  [LevelScoreFactor.CONTENT_QUALITY]: '内容质量',
  [LevelScoreFactor.COMPLIANCE]: '合规记录',
  [LevelScoreFactor.ACCOUNT_AGE]: '账号时长',
  [LevelScoreFactor.REAL_NAME]: '实名认证',
  [LevelScoreFactor.PHONE_VERIFIED]: '手机绑定'
}

export const LEVEL_SCORE_FACTOR_WEIGHTS: Record<string, number> = {
  [LevelScoreFactor.ACTIVITY]: 30,
  [LevelScoreFactor.CONTENT_QUALITY]: 30,
  [LevelScoreFactor.COMPLIANCE]: 25,
  [LevelScoreFactor.ACCOUNT_AGE]: 10,
  [LevelScoreFactor.REAL_NAME]: 5,
  [LevelScoreFactor.PHONE_VERIFIED]: 5
}

export const LEVEL_SCORE_FACTOR_DESCRIPTIONS: Record<string, string> = {
  [LevelScoreFactor.ACTIVITY]: '近30天登录天数、发布内容数、互动数',
  [LevelScoreFactor.CONTENT_QUALITY]: '内容平均评分、审核通过率、违规率',
  [LevelScoreFactor.COMPLIANCE]: '无违规记录加25分，每次违规扣5-15分',
  [LevelScoreFactor.ACCOUNT_AGE]: '注册满1个月5分，满3个月10分，满6个月15分',
  [LevelScoreFactor.REAL_NAME]: '已认证加5分',
  [LevelScoreFactor.PHONE_VERIFIED]: '已绑定加5分'
}

export const LEVEL_SCORE_THRESHOLDS: Record<number, number> = {
  [UserLevel.NORMAL]: 0,
  [UserLevel.ACTIVE]: 60,
  [UserLevel.PREMIUM]: 85
}

export enum BehaviorType {
  PUBLISH = 'publish',
  COMMENT = 'comment',
  DM = 'dm',
  LIKE = 'like',
  FOLLOW = 'follow',
  SHARE = 'share',
  REPORT = 'report',
  EDIT = 'edit'
}

export const BEHAVIOR_TYPE_NAMES: Record<string, string> = {
  [BehaviorType.PUBLISH]: '发布',
  [BehaviorType.COMMENT]: '评论',
  [BehaviorType.DM]: '私信',
  [BehaviorType.LIKE]: '点赞',
  [BehaviorType.FOLLOW]: '关注',
  [BehaviorType.SHARE]: '分享',
  [BehaviorType.REPORT]: '举报',
  [BehaviorType.EDIT]: '编辑'
}

export enum RiskLevel {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const RISK_LEVEL_NAMES: Record<number, string> = {
  [RiskLevel.NONE]: '正常',
  [RiskLevel.LOW]: '轻微',
  [RiskLevel.MEDIUM]: '中度',
  [RiskLevel.HIGH]: '重度'
}

export const RISK_LEVEL_COLORS: Record<number, string> = {
  [RiskLevel.NONE]: '#67c23a',
  [RiskLevel.LOW]: '#e6a23c',
  [RiskLevel.MEDIUM]: '#f56c6c',
  [RiskLevel.HIGH]: '#c45656'
}

export enum ViolationType {
  SPAM = 'spam',
  BATCH_LIKE = 'batch_like',
  MALICIOUS_TRAFFIC = 'malicious_traffic',
  FREQUENT_OPERATION = 'frequent_operation',
  ABNORMAL_TIME = 'abnormal_time',
  CONTENT_VIOLATION = 'content_violation',
  DUPLICATE_CONTENT = 'duplicate_content',
  HARASSMENT = 'harassment'
}

export const VIOLATION_TYPE_NAMES: Record<string, string> = {
  [ViolationType.SPAM]: '异常刷屏',
  [ViolationType.BATCH_LIKE]: '批量点赞',
  [ViolationType.MALICIOUS_TRAFFIC]: '恶意引流',
  [ViolationType.FREQUENT_OPERATION]: '频繁操作',
  [ViolationType.ABNORMAL_TIME]: '异常时段',
  [ViolationType.CONTENT_VIOLATION]: '内容违规',
  [ViolationType.DUPLICATE_CONTENT]: '重复内容',
  [ViolationType.HARASSMENT]: '骚扰行为'
}

export enum PunishmentType {
  WARNING = 'warning',
  TEMP_RESTRICT = 'temp_restrict',
  FLOW_LIMIT = 'flow_limit',
  CONTENT_DOWNGRADE = 'content_downgrade',
  TEMP_BAN = 'temp_ban',
  PERMANENT_BAN = 'permanent_ban'
}

export const PUNISHMENT_TYPE_NAMES: Record<string, string> = {
  [PunishmentType.WARNING]: '弹窗预警',
  [PunishmentType.TEMP_RESTRICT]: '短时限制',
  [PunishmentType.FLOW_LIMIT]: '账号限流',
  [PunishmentType.CONTENT_DOWNGRADE]: '内容降权',
  [PunishmentType.TEMP_BAN]: '临时封禁',
  [PunishmentType.PERMANENT_BAN]: '永久封禁'
}

export const RISK_PUNISHMENT_MAP: Record<number, string[]> = {
  [RiskLevel.NONE]: [],
  [RiskLevel.LOW]: [PunishmentType.WARNING, PunishmentType.TEMP_RESTRICT],
  [RiskLevel.MEDIUM]: [PunishmentType.FLOW_LIMIT, PunishmentType.CONTENT_DOWNGRADE],
  [RiskLevel.HIGH]: [PunishmentType.TEMP_BAN, PunishmentType.PERMANENT_BAN]
}

export enum PunishmentStatus {
  ACTIVE = 0,
  REVOKED = 1,
  EXPIRED = 2,
  APPEALED = 3
}

export const PUNISHMENT_STATUS_NAMES: Record<number, string> = {
  [PunishmentStatus.ACTIVE]: '生效中',
  [PunishmentStatus.REVOKED]: '已解除',
  [PunishmentStatus.EXPIRED]: '已过期',
  [PunishmentStatus.APPEALED]: '申诉中'
}

export enum ActivityLevel {
  SLEEPER = -1,
  LOW = 0,
  NORMAL = 1,
  HIGH = 2
}

export const ACTIVITY_LEVEL_NAMES: Record<number, string> = {
  [ActivityLevel.SLEEPER]: '沉睡',
  [ActivityLevel.LOW]: '低活跃',
  [ActivityLevel.NORMAL]: '正常',
  [ActivityLevel.HIGH]: '高活跃'
}

export const ACTIVITY_LEVEL_COLORS: Record<number, string> = {
  [ActivityLevel.SLEEPER]: '#909399',
  [ActivityLevel.LOW]: '#e6a23c',
  [ActivityLevel.NORMAL]: '#409eff',
  [ActivityLevel.HIGH]: '#67c23a'
}

export enum ActivityScoreFactor {
  DAILY_LOGIN = 'daily_login',
  WEEKLY_LOGIN = 'weekly_login',
  MONTHLY_LOGIN = 'monthly_login',
  PUBLISH = 'publish',
  COMMENT = 'comment',
  LIKE = 'like',
  INTERACT = 'interact',
  SHARE = 'share'
}

export const ACTIVITY_SCORE_FACTOR_NAMES: Record<string, string> = {
  [ActivityScoreFactor.DAILY_LOGIN]: '日登录',
  [ActivityScoreFactor.WEEKLY_LOGIN]: '周登录',
  [ActivityScoreFactor.MONTHLY_LOGIN]: '月登录',
  [ActivityScoreFactor.PUBLISH]: '发布内容',
  [ActivityScoreFactor.COMMENT]: '评论',
  [ActivityScoreFactor.LIKE]: '点赞',
  [ActivityScoreFactor.INTERACT]: '互动',
  [ActivityScoreFactor.SHARE]: '分享'
}

export const ACTIVITY_SCORE_FACTOR_WEIGHTS: Record<string, number> = {
  [ActivityScoreFactor.DAILY_LOGIN]: 15,
  [ActivityScoreFactor.WEEKLY_LOGIN]: 10,
  [ActivityScoreFactor.MONTHLY_LOGIN]: 5,
  [ActivityScoreFactor.PUBLISH]: 25,
  [ActivityScoreFactor.COMMENT]: 15,
  [ActivityScoreFactor.LIKE]: 10,
  [ActivityScoreFactor.INTERACT]: 15,
  [ActivityScoreFactor.SHARE]: 5
}

export const ACTIVITY_LEVEL_THRESHOLDS: Record<number, { min: number; max: number }> = {
  [ActivityLevel.SLEEPER]: { min: -1, max: 19 },
  [ActivityLevel.LOW]: { min: 20, max: 49 },
  [ActivityLevel.NORMAL]: { min: 50, max: 79 },
  [ActivityLevel.HIGH]: { min: 80, max: 100 }
}

export enum OperationStrategyType {
  FLOW_BOOST = 'flow_boost',
  ACTIVITY_PRIORITY = 'activity_priority',
  WAKEUP_MESSAGE = 'wakeup_message',
  BENEFIT_GRANT = 'benefit_grant',
  FOCUS_MAINTENANCE = 'focus_maintenance',
  CUSTOM = 'custom'
}

export const OPERATION_STRATEGY_NAMES: Record<string, string> = {
  [OperationStrategyType.FLOW_BOOST]: '流量扶持',
  [OperationStrategyType.ACTIVITY_PRIORITY]: '活动优先参与',
  [OperationStrategyType.WAKEUP_MESSAGE]: '唤醒消息推送',
  [OperationStrategyType.BENEFIT_GRANT]: '权益发放',
  [OperationStrategyType.FOCUS_MAINTENANCE]: '重点运维标记',
  [OperationStrategyType.CUSTOM]: '自定义操作'
}

export const ACTIVITY_LEVEL_STRATEGY_MAP: Record<number, string[]> = {
  [ActivityLevel.SLEEPER]: [OperationStrategyType.WAKEUP_MESSAGE, OperationStrategyType.BENEFIT_GRANT],
  [ActivityLevel.LOW]: [OperationStrategyType.FOCUS_MAINTENANCE, OperationStrategyType.FLOW_BOOST],
  [ActivityLevel.NORMAL]: [OperationStrategyType.FLOW_BOOST],
  [ActivityLevel.HIGH]: [OperationStrategyType.FLOW_BOOST, OperationStrategyType.ACTIVITY_PRIORITY, OperationStrategyType.BENEFIT_GRANT]
}

export enum OperationExecuteType {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled'
}

export const OPERATION_EXECUTE_NAMES: Record<string, string> = {
  [OperationExecuteType.IMMEDIATE]: '即时生效',
  [OperationExecuteType.SCHEDULED]: '定时生效'
}

export enum OperationStatus {
  PENDING = 0,
  RUNNING = 1,
  COMPLETED = 2,
  FAILED = 3,
  CANCELLED = 4,
  SCHEDULED = 5
}

export const OPERATION_STATUS_NAMES: Record<number, string> = {
  [OperationStatus.PENDING]: '待处理',
  [OperationStatus.RUNNING]: '执行中',
  [OperationStatus.COMPLETED]: '已完成',
  [OperationStatus.FAILED]: '失败',
  [OperationStatus.CANCELLED]: '已取消',
  [OperationStatus.SCHEDULED]: '已定时'
}

export enum ActivityAbnormalType {
  FAKE_SCORE = 'fake_score',
  ABNORMAL_FLUCTUATION = 'abnormal_fluctuation',
  FAKE_INTERACT = 'fake_interact',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  DATA_DISCONTINUITY = 'data_discontinuity'
}

export const ACTIVITY_ABNORMAL_NAMES: Record<string, string> = {
  [ActivityAbnormalType.FAKE_SCORE]: '虚假活跃度',
  [ActivityAbnormalType.ABNORMAL_FLUCTUATION]: '异常分值波动',
  [ActivityAbnormalType.FAKE_INTERACT]: '虚假互动',
  [ActivityAbnormalType.SUSPICIOUS_PATTERN]: '可疑行为模式',
  [ActivityAbnormalType.DATA_DISCONTINUITY]: '数据不连续'
}

export enum ActivityLogType {
  LEVEL_CHANGE = 'level_change',
  STRATEGY_APPLY = 'strategy_apply',
  BATCH_OPERATION = 'batch_operation',
  MANUAL_REFRESH = 'manual_refresh',
  AUTO_UPDATE = 'auto_update',
  BENEFIT_GRANT = 'benefit_grant'
}

export const ACTIVITY_LOG_TYPE_NAMES: Record<string, string> = {
  [ActivityLogType.LEVEL_CHANGE]: '等级变更',
  [ActivityLogType.STRATEGY_APPLY]: '策略适配',
  [ActivityLogType.BATCH_OPERATION]: '批量操作',
  [ActivityLogType.MANUAL_REFRESH]: '手动刷新',
  [ActivityLogType.AUTO_UPDATE]: '自动更新',
  [ActivityLogType.BENEFIT_GRANT]: '权益发放'
}

export enum ActivityBatchType {
  WAKE_UP_SLEEPING = 'wake_up_sleeping',
  GRANT_BENEFIT_HIGH = 'grant_benefit_high',
  MARK_FOCUS_LOW = 'mark_focus_low',
  SEND_PUSH_NOTIFY = 'send_push_notify'
}

export const ACTIVITY_BATCH_TYPE_NAMES: Record<string, string> = {
  [ActivityBatchType.WAKE_UP_SLEEPING]: '批量唤醒沉睡用户',
  [ActivityBatchType.GRANT_BENEFIT_HIGH]: '批量发放高活跃权益',
  [ActivityBatchType.MARK_FOCUS_LOW]: '批量标记低活跃重点运维',
  [ActivityBatchType.SEND_PUSH_NOTIFY]: '批量推送通知消息'
}

export enum QualificationApplyStatus {
  PENDING = 0,
  UNDER_REVIEW = 1,
  APPROVED = 2,
  REJECTED = 3,
  EXPIRED = 4
}

export const QUALIFICATION_APPLY_STATUS_NAMES: Record<number, string> = {
  [QualificationApplyStatus.PENDING]: '待提交',
  [QualificationApplyStatus.UNDER_REVIEW]: '审核中',
  [QualificationApplyStatus.APPROVED]: '已通过',
  [QualificationApplyStatus.REJECTED]: '已驳回',
  [QualificationApplyStatus.EXPIRED]: '已过期'
}

export const QUALIFICATION_APPLY_STATUS_COLORS: Record<number, string> = {
  [QualificationApplyStatus.PENDING]: '#909399',
  [QualificationApplyStatus.UNDER_REVIEW]: '#e6a23c',
  [QualificationApplyStatus.APPROVED]: '#67c23a',
  [QualificationApplyStatus.REJECTED]: '#f56c6c',
  [QualificationApplyStatus.EXPIRED]: '#909399'
}

export const QUALIFICATION_APPLY_TAG_TYPES: Record<number, string> = {
  [QualificationApplyStatus.PENDING]: 'info',
  [QualificationApplyStatus.UNDER_REVIEW]: 'warning',
  [QualificationApplyStatus.APPROVED]: 'success',
  [QualificationApplyStatus.REJECTED]: 'danger',
  [QualificationApplyStatus.EXPIRED]: 'info'
}

export enum QualificationType {
  ID_CARD = 'id_card',
  BUSINESS_LICENSE = 'business_license',
  INDUSTRY_CERT = 'industry_cert',
  OTHER = 'other'
}

export const QUALIFICATION_TYPE_NAMES: Record<string, string> = {
  [QualificationType.ID_CARD]: '身份证件',
  [QualificationType.BUSINESS_LICENSE]: '营业执照',
  [QualificationType.INDUSTRY_CERT]: '行业资质证',
  [QualificationType.OTHER]: '其他材料'
}

export enum QualificationLogType {
  SUBMIT = 'submit',
  PRE_CHECK = 'pre_check',
  AUDIT_PASS = 'audit_pass',
  AUDIT_REJECT = 'audit_reject',
  BATCH_PASS = 'batch_pass',
  BATCH_REJECT = 'batch_reject',
  EXPIRE = 'expire',
  RENEW = 'renew',
  FAKE_DETECT = 'fake_detect',
  STATUS_CHANGE = 'status_change',
  BENEFIT_CHANGE = 'benefit_change'
}

export const QUALIFICATION_LOG_TYPE_NAMES: Record<string, string> = {
  [QualificationLogType.SUBMIT]: '提交申请',
  [QualificationLogType.PRE_CHECK]: '前置校验',
  [QualificationLogType.AUDIT_PASS]: '审核通过',
  [QualificationLogType.AUDIT_REJECT]: '审核驳回',
  [QualificationLogType.BATCH_PASS]: '批量通过',
  [QualificationLogType.BATCH_REJECT]: '批量驳回',
  [QualificationLogType.EXPIRE]: '资质过期',
  [QualificationLogType.RENEW]: '资质续期',
  [QualificationLogType.FAKE_DETECT]: '虚假资质检测',
  [QualificationLogType.STATUS_CHANGE]: '身份状态变更',
  [QualificationLogType.BENEFIT_CHANGE]: '权益变更'
}

export enum CreatorIdentityStatus {
  NORMAL = 0,
  VERIFIED = 1,
  RESTRICTED = 2,
  BANNED = 3
}

export const CREATOR_IDENTITY_STATUS_NAMES: Record<number, string> = {
  [CreatorIdentityStatus.NORMAL]: '普通用户',
  [CreatorIdentityStatus.VERIFIED]: '认证达人',
  [CreatorIdentityStatus.RESTRICTED]: '受限达人',
  [CreatorIdentityStatus.BANNED]: '封禁达人'
}

export const CREATOR_IDENTITY_STATUS_COLORS: Record<number, string> = {
  [CreatorIdentityStatus.NORMAL]: '#909399',
  [CreatorIdentityStatus.VERIFIED]: '#67c23a',
  [CreatorIdentityStatus.RESTRICTED]: '#e6a23c',
  [CreatorIdentityStatus.BANNED]: '#f56c6c'
}

export enum CreatorBenefit {
  LIVE_STREAMING = 'live_streaming',
  PRODUCT_LINK = 'product_link',
  SHOPPING_CART = 'shopping_cart',
  BRAND_COOPERATION = 'brand_cooperation',
  COMMISSION = 'commission',
  DATA_ANALYTICS = 'data_analytics',
  ACTIVITY_PRIORITY = 'activity_priority',
  CUSTOMER_SERVICE = 'customer_service',
  VERIFIED_BADGE = 'verified_badge',
  FLOW_BOOST = 'flow_boost'
}

export const CREATOR_BENEFIT_NAMES: Record<string, string> = {
  [CreatorBenefit.LIVE_STREAMING]: '直播带货',
  [CreatorBenefit.PRODUCT_LINK]: '商品链接',
  [CreatorBenefit.SHOPPING_CART]: '购物车功能',
  [CreatorBenefit.BRAND_COOPERATION]: '品牌合作',
  [CreatorBenefit.COMMISSION]: '佣金结算',
  [CreatorBenefit.DATA_ANALYTICS]: '数据分析',
  [CreatorBenefit.ACTIVITY_PRIORITY]: '活动优先',
  [CreatorBenefit.CUSTOMER_SERVICE]: '专属客服',
  [CreatorBenefit.VERIFIED_BADGE]: '认证标识',
  [CreatorBenefit.FLOW_BOOST]: '流量扶持'
}

export enum MerchantApplyStatus {
  DRAFT = 0,
  PENDING_INITIAL = 1,
  PENDING_FINAL = 2,
  INITIAL_PASSED = 3,
  APPROVED = 4,
  REJECTED = 5,
  RETURNED = 6
}

export const MERCHANT_APPLY_STATUS_NAMES: Record<number, string> = {
  [MerchantApplyStatus.DRAFT]: '草稿',
  [MerchantApplyStatus.PENDING_INITIAL]: '待初审',
  [MerchantApplyStatus.PENDING_FINAL]: '待终审',
  [MerchantApplyStatus.INITIAL_PASSED]: '初审通过',
  [MerchantApplyStatus.APPROVED]: '终审通过',
  [MerchantApplyStatus.REJECTED]: '已驳回',
  [MerchantApplyStatus.RETURNED]: '已退回'
}

export const MERCHANT_APPLY_STATUS_TAG_TYPES: Record<number, string> = {
  [MerchantApplyStatus.DRAFT]: 'info',
  [MerchantApplyStatus.PENDING_INITIAL]: 'warning',
  [MerchantApplyStatus.PENDING_FINAL]: 'warning',
  [MerchantApplyStatus.INITIAL_PASSED]: '',
  [MerchantApplyStatus.APPROVED]: 'success',
  [MerchantApplyStatus.REJECTED]: 'danger',
  [MerchantApplyStatus.RETURNED]: 'info'
}

export enum MerchantType {
  NORMAL = 'normal',
  BRAND = 'brand'
}

export const MERCHANT_TYPE_NAMES: Record<string, string> = {
  [MerchantType.NORMAL]: '普通商家',
  [MerchantType.BRAND]: '品牌商家'
}

export enum MerchantRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export const MERCHANT_RISK_LEVEL_NAMES: Record<string, string> = {
  [MerchantRiskLevel.LOW]: '低风险',
  [MerchantRiskLevel.MEDIUM]: '中风险',
  [MerchantRiskLevel.HIGH]: '高风险'
}

export const MERCHANT_RISK_LEVEL_COLORS: Record<string, string> = {
  [MerchantRiskLevel.LOW]: '#67c23a',
  [MerchantRiskLevel.MEDIUM]: '#e6a23c',
  [MerchantRiskLevel.HIGH]: '#f56c6c'
}

export enum MerchantOnboardingLogType {
  SUBMIT = 'submit',
  PRE_CHECK = 'pre_check',
  INITIAL_PASS = 'initial_pass',
  INITIAL_REJECT = 'initial_reject',
  FINAL_PASS = 'final_pass',
  FINAL_REJECT = 'final_reject',
  BATCH_PASS = 'batch_pass',
  BATCH_REJECT = 'batch_reject',
  BATCH_RETURN = 'batch_return',
  RETURN = 'return',
  STATUS_CHANGE = 'status_change',
  PERMISSION_CHANGE = 'permission_change',
  DUPLICATE_DETECT = 'duplicate_detect',
  FAKE_DETECT = 'fake_detect',
  CROSS_INDUSTRY_DETECT = 'cross_industry_detect',
  CREDIT_UPDATE = 'credit_update'
}

export const MERCHANT_ONBOARDING_LOG_TYPE_NAMES: Record<string, string> = {
  [MerchantOnboardingLogType.SUBMIT]: '提交申请',
  [MerchantOnboardingLogType.PRE_CHECK]: '前置校验',
  [MerchantOnboardingLogType.INITIAL_PASS]: '初审通过',
  [MerchantOnboardingLogType.INITIAL_REJECT]: '初审驳回',
  [MerchantOnboardingLogType.FINAL_PASS]: '终审通过',
  [MerchantOnboardingLogType.FINAL_REJECT]: '终审驳回',
  [MerchantOnboardingLogType.BATCH_PASS]: '批量通过',
  [MerchantOnboardingLogType.BATCH_REJECT]: '批量驳回',
  [MerchantOnboardingLogType.BATCH_RETURN]: '批量退回',
  [MerchantOnboardingLogType.RETURN]: '退回补充',
  [MerchantOnboardingLogType.STATUS_CHANGE]: '状态变更',
  [MerchantOnboardingLogType.PERMISSION_CHANGE]: '权限变更',
  [MerchantOnboardingLogType.DUPLICATE_DETECT]: '重复入驻检测',
  [MerchantOnboardingLogType.FAKE_DETECT]: '虚假资质检测',
  [MerchantOnboardingLogType.CROSS_INDUSTRY_DETECT]: '跨行业违规检测',
  [MerchantOnboardingLogType.CREDIT_UPDATE]: '信用评分更新'
}

export const MERCHANT_CREDIT_LEVEL_COLORS: Record<string, string> = {
  A: '#67c23a',
  B: '#409eff',
  C: '#e6a23c',
  D: '#f56c6c'
}

export enum CommentStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2
}

export const COMMENT_STATUS_NAMES: Record<number, string> = {
  [CommentStatus.PENDING]: '待审核',
  [CommentStatus.APPROVED]: '已通过',
  [CommentStatus.REJECTED]: '已驳回'
}

export const COMMENT_STATUS_TAG_TYPES: Record<number, string> = {
  [CommentStatus.PENDING]: 'warning',
  [CommentStatus.APPROVED]: 'success',
  [CommentStatus.REJECTED]: 'danger'
}

export enum CommentRiskLevel {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const COMMENT_RISK_LEVEL_NAMES: Record<number, string> = {
  [CommentRiskLevel.NONE]: '正常',
  [CommentRiskLevel.LOW]: '轻微',
  [CommentRiskLevel.MEDIUM]: '中度',
  [CommentRiskLevel.HIGH]: '重度'
}

export const COMMENT_RISK_LEVEL_COLORS: Record<number, string> = {
  [CommentRiskLevel.NONE]: '#67c23a',
  [CommentRiskLevel.LOW]: '#e6a23c',
  [CommentRiskLevel.MEDIUM]: '#f56c6c',
  [CommentRiskLevel.HIGH]: '#c45656'
}

export enum ComplianceViolationType {
  SENSITIVE_WORD = 'sensitive_word',
  VIOLATION_PHRASE = 'violation_phrase',
  TRAFFIC_KEYWORD = 'traffic_keyword',
  HIGH_FREQUENCY = 'high_frequency',
  DUPLICATE_CONTENT = 'duplicate_content',
  IRRELEVANT = 'irrelevant'
}

export const COMPLIANCE_VIOLATION_TYPE_NAMES: Record<string, string> = {
  [ComplianceViolationType.SENSITIVE_WORD]: '敏感词',
  [ComplianceViolationType.VIOLATION_PHRASE]: '违规话术',
  [ComplianceViolationType.TRAFFIC_KEYWORD]: '引流关键词',
  [ComplianceViolationType.HIGH_FREQUENCY]: '高频评论',
  [ComplianceViolationType.DUPLICATE_CONTENT]: '重复评论',
  [ComplianceViolationType.IRRELEVANT]: '无关评论'
}

export enum DirectMessageStatus {
  PENDING = 0,
  NORMAL = 1,
  INTERCEPTED = 2,
  RECALLED = 3,
  DELETED = 4
}

export const DM_STATUS_NAMES: Record<number, string> = {
  [DirectMessageStatus.PENDING]: '待审核',
  [DirectMessageStatus.NORMAL]: '已发送',
  [DirectMessageStatus.INTERCEPTED]: '已拦截',
  [DirectMessageStatus.RECALLED]: '已撤回',
  [DirectMessageStatus.DELETED]: '已删除'
}

export const DM_STATUS_TAG_TYPES: Record<number, string> = {
  [DirectMessageStatus.PENDING]: 'warning',
  [DirectMessageStatus.NORMAL]: 'success',
  [DirectMessageStatus.INTERCEPTED]: 'danger',
  [DirectMessageStatus.RECALLED]: 'info',
  [DirectMessageStatus.DELETED]: 'info'
}

export enum DmRiskLevel {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const DM_RISK_LEVEL_NAMES: Record<number, string> = {
  [DmRiskLevel.NONE]: '正常',
  [DmRiskLevel.LOW]: '轻微',
  [DmRiskLevel.MEDIUM]: '中度',
  [DmRiskLevel.HIGH]: '重度'
}

export const DM_RISK_LEVEL_COLORS: Record<number, string> = {
  [DmRiskLevel.NONE]: '#67c23a',
  [DmRiskLevel.LOW]: '#e6a23c',
  [DmRiskLevel.MEDIUM]: '#f56c6c',
  [DmRiskLevel.HIGH]: '#c45656'
}

export enum DmConversationStatus {
  BANNED = 0,
  NORMAL = 1,
  RESTRICTED = 2
}

export const DM_CONVERSATION_STATUS_NAMES: Record<number, string> = {
  [DmConversationStatus.BANNED]: '已封禁',
  [DmConversationStatus.NORMAL]: '正常',
  [DmConversationStatus.RESTRICTED]: '已限制'
}

export const DM_CONVERSATION_STATUS_TAG_TYPES: Record<number, string> = {
  [DmConversationStatus.BANNED]: 'danger',
  [DmConversationStatus.NORMAL]: 'success',
  [DmConversationStatus.RESTRICTED]: 'warning'
}

export enum DmPunishmentType {
  WARNING = 'warning',
  TEMP_RESTRICT_DM = 'temp_restrict_dm',
  TEMP_BAN_DM = 'temp_ban_dm',
  PERMANENT_BAN_DM = 'permanent_ban_dm'
}

export const DM_PUNISHMENT_TYPE_NAMES: Record<string, string> = {
  [DmPunishmentType.WARNING]: '弹窗预警',
  [DmPunishmentType.TEMP_RESTRICT_DM]: '限制私信',
  [DmPunishmentType.TEMP_BAN_DM]: '临时封禁私信',
  [DmPunishmentType.PERMANENT_BAN_DM]: '永久封禁私信'
}

export const DM_PUNISHMENT_DURATIONS: Record<string, number> = {
  warning: 0,
  temp_restrict_dm: 24 * 60,
  temp_ban_dm: 3 * 24 * 60,
  permanent_ban_dm: 0
}

export enum DmViolationType {
  ACCOUNT_BANNED = 'account_banned',
  DM_RESTRICTED = 'dm_restricted',
  FLOW_LIMITED = 'flow_limited',
  CONVERSATION_RESTRICTED = 'conversation_restricted',
  SENSITIVE_WORD = 'sensitive_word',
  VIOLATION_PHRASE = 'violation_phrase',
  TRAFFIC_KEYWORD = 'traffic_keyword',
  HARASSMENT = 'harassment',
  DAILY_LIMIT_EXCEEDED = 'daily_limit_exceeded',
  HIGH_FREQUENCY = 'high_frequency',
  DUPLICATE_CONTENT = 'duplicate_content'
}

export const DM_VIOLATION_TYPE_NAMES: Record<string, string> = {
  [DmViolationType.ACCOUNT_BANNED]: '账号封禁',
  [DmViolationType.DM_RESTRICTED]: '私信受限',
  [DmViolationType.FLOW_LIMITED]: '账号限流',
  [DmViolationType.CONVERSATION_RESTRICTED]: '会话受限',
  [DmViolationType.SENSITIVE_WORD]: '敏感词',
  [DmViolationType.VIOLATION_PHRASE]: '违规话术',
  [DmViolationType.TRAFFIC_KEYWORD]: '引流关键词',
  [DmViolationType.HARASSMENT]: '骚扰话术',
  [DmViolationType.DAILY_LIMIT_EXCEEDED]: '日发送超限',
  [DmViolationType.HIGH_FREQUENCY]: '高频发送',
  [DmViolationType.DUPLICATE_CONTENT]: '重复内容'
}

export enum DmAuditAction {
  AUTO_INTERCEPT = 0,
  COMPLIANCE_PASS = 1,
  VIOLATION_DELETE = 2,
  ACCOUNT_PUNISH = 3,
  BATCH_CLEAN = 4,
  BATCH_BAN = 5,
  CONVERSATION_RESTRICT = 6,
  CONVERSATION_UNRESTRICT = 7,
  MANUAL_REVIEW = 8
}

export const DM_AUDIT_ACTION_NAMES: Record<number, string> = {
  [DmAuditAction.AUTO_INTERCEPT]: '自动拦截',
  [DmAuditAction.COMPLIANCE_PASS]: '合规通过',
  [DmAuditAction.VIOLATION_DELETE]: '违规删除',
  [DmAuditAction.ACCOUNT_PUNISH]: '账号处罚',
  [DmAuditAction.BATCH_CLEAN]: '批量清理',
  [DmAuditAction.BATCH_BAN]: '批量封禁',
  [DmAuditAction.CONVERSATION_RESTRICT]: '会话限制',
  [DmAuditAction.CONVERSATION_UNRESTRICT]: '解除限制',
  [DmAuditAction.MANUAL_REVIEW]: '人工复核'
}

export enum InteractionDataType {
  LIKE = 'like',
  FAVORITE = 'favorite',
  SHARE = 'share',
  COMMENT = 'comment'
}

export const INTERACTION_DATA_TYPE_NAMES: Record<string, string> = {
  [InteractionDataType.LIKE]: '点赞',
  [InteractionDataType.FAVORITE]: '收藏',
  [InteractionDataType.SHARE]: '转发',
  [InteractionDataType.COMMENT]: '评论'
}

export const INTERACTION_DATA_TYPE_ICONS: Record<string, string> = {
  like: '👍', favorite: '⭐', share: '🔗', comment: '💬'
}

export enum InteractionAnomalyLevel {
  NORMAL = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const INTERACTION_ANOMALY_LEVEL_NAMES: Record<number, string> = {
  [InteractionAnomalyLevel.NORMAL]: '正常',
  [InteractionAnomalyLevel.LOW]: '轻微异常',
  [InteractionAnomalyLevel.MEDIUM]: '中度异常',
  [InteractionAnomalyLevel.HIGH]: '重度异常'
}

export const INTERACTION_ANOMALY_LEVEL_COLORS: Record<number, string> = {
  [InteractionAnomalyLevel.NORMAL]: '#67c23a',
  [InteractionAnomalyLevel.LOW]: '#e6a23c',
  [InteractionAnomalyLevel.MEDIUM]: '#f56c6c',
  [InteractionAnomalyLevel.HIGH]: '#c45656'
}

export enum InteractionDataStatus {
  ZEROED = 0,
  NORMAL = 1,
  CALIBRATED = 2,
  QUALITY = 3
}

export const INTERACTION_DATA_STATUS_NAMES: Record<number, string> = {
  [InteractionDataStatus.ZEROED]: '已清零',
  [InteractionDataStatus.NORMAL]: '正常',
  [InteractionDataStatus.CALIBRATED]: '已校准',
  [InteractionDataStatus.QUALITY]: '优质标记'
}

export const INTERACTION_DATA_STATUS_TAG_TYPES: Record<number, string> = {
  [InteractionDataStatus.ZEROED]: 'danger',
  [InteractionDataStatus.NORMAL]: 'success',
  [InteractionDataStatus.CALIBRATED]: 'warning',
  [InteractionDataStatus.QUALITY]: ''
}

export enum InteractionFlowLevel {
  NORMAL = 1,
  QUALITY = 2,
  HOT = 3
}

export const INTERACTION_FLOW_LEVEL_NAMES: Record<number, string> = {
  [InteractionFlowLevel.NORMAL]: '普通池',
  [InteractionFlowLevel.QUALITY]: '优质池',
  [InteractionFlowLevel.HOT]: '热门池'
}

export const INTERACTION_FLOW_LEVEL_COLORS: Record<number, string> = {
  [InteractionFlowLevel.NORMAL]: '#909399',
  [InteractionFlowLevel.QUALITY]: '#409eff',
  [InteractionFlowLevel.HOT]: '#e6a23c'
}

export enum InteractionAnomalyType {
  SUDDEN_SURGE = 'sudden_surge',
  NO_REAL_TRACE = 'no_real_trace',
  MACHINE_BRUSH = 'machine_brush',
  DUPLICATE = 'duplicate',
  REPEATED = 'repeated'
}

export const INTERACTION_ANOMALY_TYPE_NAMES: Record<string, string> = {
  [InteractionAnomalyType.SUDDEN_SURGE]: '数据暴涨',
  [InteractionAnomalyType.NO_REAL_TRACE]: '无真实轨迹',
  [InteractionAnomalyType.MACHINE_BRUSH]: '机器刷量',
  [InteractionAnomalyType.DUPLICATE]: '重复互动',
  [InteractionAnomalyType.REPEATED]: '频繁操作'
}

export enum InteractionOpsAction {
  AUTO_DETECT = 0,
  MANUAL_MARK = 1,
  BATCH_CALIBRATE = 2,
  BATCH_ZERO = 3,
  BATCH_QUALITY = 4,
  WEIGHT_LINK = 5,
  RESTORE = 6
}

export const INTERACTION_OPS_ACTION_NAMES: Record<number, string> = {
  [InteractionOpsAction.AUTO_DETECT]: '自动检测异常',
  [InteractionOpsAction.MANUAL_MARK]: '人工标记异常',
  [InteractionOpsAction.BATCH_CALIBRATE]: '批量校准',
  [InteractionOpsAction.BATCH_ZERO]: '批量清零',
  [InteractionOpsAction.BATCH_QUALITY]: '批量标记优质',
  [InteractionOpsAction.WEIGHT_LINK]: '权重联动',
  [InteractionOpsAction.RESTORE]: '恢复'
}

export enum HotCommentIsTop {
  NONE = 0,
  AUTO = 1,
  MANUAL = 2
}

export const HOT_COMMENT_IS_TOP_NAMES: Record<number, string> = {
  [HotCommentIsTop.NONE]: '未置顶',
  [HotCommentIsTop.AUTO]: '系统自动置顶',
  [HotCommentIsTop.MANUAL]: '人工置顶'
}

export const HOT_COMMENT_IS_TOP_COLORS: Record<number, string> = {
  [HotCommentIsTop.NONE]: '#909399',
  [HotCommentIsTop.AUTO]: '#409eff',
  [HotCommentIsTop.MANUAL]: '#e6a23c'
}

export enum HotCommentStatus {
  OFF_SHELF = 0,
  ACTIVE = 1,
  PENDING = 2,
  CONFLICT = 3
}

export const HOT_COMMENT_STATUS_NAMES: Record<number, string> = {
  [HotCommentStatus.OFF_SHELF]: '已下架',
  [HotCommentStatus.ACTIVE]: '正常上榜',
  [HotCommentStatus.PENDING]: '待审核',
  [HotCommentStatus.CONFLICT]: '冲突拦截'
}

export const HOT_COMMENT_STATUS_TAG_TYPES: Record<number, string> = {
  [HotCommentStatus.OFF_SHELF]: 'info',
  [HotCommentStatus.ACTIVE]: 'success',
  [HotCommentStatus.PENDING]: 'warning',
  [HotCommentStatus.CONFLICT]: 'danger'
}

export enum HotCommentSourceType {
  AUTO = 'auto',
  MANUAL = 'manual',
  BATCH = 'batch'
}

export const HOT_COMMENT_SOURCE_NAMES: Record<string, string> = {
  auto: '系统自动',
  manual: '人工操作',
  batch: '批量操作'
}

export enum HotCommentLogAction {
  ON_BOARD = 0,
  AUTO_TOP = 1,
  MANUAL_TOP = 2,
  CANCEL_TOP = 3,
  OFF_SHELF = 4,
  BATCH_TOP = 5,
  BATCH_OFF = 6,
  REFRESH_RANK = 7,
  CONFLICT_BLOCK = 8,
  ANOMALY_BLOCK = 9
}

export const HOT_COMMENT_LOG_ACTION_NAMES: Record<number, string> = {
  [HotCommentLogAction.ON_BOARD]: '上榜',
  [HotCommentLogAction.AUTO_TOP]: '自动置顶',
  [HotCommentLogAction.MANUAL_TOP]: '人工置顶',
  [HotCommentLogAction.CANCEL_TOP]: '取消置顶',
  [HotCommentLogAction.OFF_SHELF]: '下架',
  [HotCommentLogAction.BATCH_TOP]: '批量置顶',
  [HotCommentLogAction.BATCH_OFF]: '批量下架',
  [HotCommentLogAction.REFRESH_RANK]: '刷新排序',
  [HotCommentLogAction.CONFLICT_BLOCK]: '冲突拦截',
  [HotCommentLogAction.ANOMALY_BLOCK]: '异常拦截'
}
