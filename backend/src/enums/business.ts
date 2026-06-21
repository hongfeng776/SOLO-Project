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

export const BEHAVIOR_FREQUENCY_LIMITS: Record<string, { window: number; max: number }> = {
  [BehaviorType.PUBLISH]: { window: 60, max: 5 },
  [BehaviorType.COMMENT]: { window: 60, max: 20 },
  [BehaviorType.DM]: { window: 60, max: 15 },
  [BehaviorType.LIKE]: { window: 60, max: 50 },
  [BehaviorType.FOLLOW]: { window: 60, max: 20 }
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

// ========== 营销活动（Campaign）状态枚举 ==========
export enum CampaignStatus {
  DRAFT = 0,
  ONLINE = 1,
  OFFLINE = 2,
  CANCELLED = 3
}

export const CAMPAIGN_STATUS_NAMES: Record<number, string> = {
  [CampaignStatus.DRAFT]: '草稿',
  [CampaignStatus.ONLINE]: '上线',
  [CampaignStatus.OFFLINE]: '下线',
  [CampaignStatus.CANCELLED]: '已取消'
}

export const CAMPAIGN_STATUS_COLORS: Record<number, string> = {
  [CampaignStatus.DRAFT]: '#909399',
  [CampaignStatus.ONLINE]: '#67c23a',
  [CampaignStatus.OFFLINE]: '#f56c6c',
  [CampaignStatus.CANCELLED]: '#c0c4cc'
}

// ========== 营销活动（Campaign）类型枚举 ==========
export enum CampaignType {
  PROMOTION = 'promotion',
  DELIVERY = 'delivery',
  SIGN_IN = 'sign_in',
  LUCKY_DRAW = 'lucky_draw',
  REBATE = 'rebate',
  CUSTOM = 'custom'
}

export const CAMPAIGN_TYPE_NAMES: Record<string, string> = {
  [CampaignType.PROMOTION]: '促销活动',
  [CampaignType.DELIVERY]: '投放活动',
  [CampaignType.SIGN_IN]: '签到活动',
  [CampaignType.LUCKY_DRAW]: '抽奖活动',
  [CampaignType.REBATE]: '返利活动',
  [CampaignType.CUSTOM]: '自定义'
}

// ========== 营销活动适配场景枚举 ==========
export enum CampaignScene {
  HOME_PAGE = 'home_page',
  PRODUCT_DETAIL = 'product_detail',
  USER_CENTER = 'user_center',
  CHECKOUT = 'checkout',
  PUSH_NOTIFICATION = 'push_notification',
  POPUP = 'popup',
  SHARE = 'share',
  NEW_USER = 'new_user',
  RETURNING_USER = 'returning_user'
}

export const CAMPAIGN_SCENE_NAMES: Record<string, string> = {
  [CampaignScene.HOME_PAGE]: '首页',
  [CampaignScene.PRODUCT_DETAIL]: '商品详情',
  [CampaignScene.USER_CENTER]: '用户中心',
  [CampaignScene.CHECKOUT]: '结算页',
  [CampaignScene.PUSH_NOTIFICATION]: '推送通知',
  [CampaignScene.POPUP]: '弹窗',
  [CampaignScene.SHARE]: '分享',
  [CampaignScene.NEW_USER]: '新用户',
  [CampaignScene.RETURNING_USER]: '回流用户'
}

// ========== 参与范围类型 ==========
export enum ParticipationScopeType {
  ALL_USERS = 'all_users',
  USER_LEVEL = 'user_level',
  USER_TAG = 'user_tag',
  USER_GROUP = 'user_group',
  SPECIFIC_USERS = 'specific_users',
  NEW_USERS = 'new_users',
  REGION = 'region'
}

export const PARTICIPATION_SCOPE_NAMES: Record<string, string> = {
  [ParticipationScopeType.ALL_USERS]: '全部用户',
  [ParticipationScopeType.USER_LEVEL]: '按用户等级',
  [ParticipationScopeType.USER_TAG]: '按用户标签',
  [ParticipationScopeType.USER_GROUP]: '按用户分组',
  [ParticipationScopeType.SPECIFIC_USERS]: '指定用户',
  [ParticipationScopeType.NEW_USERS]: '新注册用户',
  [ParticipationScopeType.REGION]: '按地域'
}

// ========== 奖励类型 ==========
export enum RewardType {
  COUPON = 'coupon',
  CASH = 'cash',
  POINTS = 'points',
  DISCOUNT = 'discount',
  FREE_SHIPPING = 'free_shipping',
  GIFT = 'gift',
  VOUCHER = 'voucher'
}

export const REWARD_TYPE_NAMES: Record<string, string> = {
  [RewardType.COUPON]: '优惠券',
  [RewardType.CASH]: '现金',
  [RewardType.POINTS]: '积分',
  [RewardType.DISCOUNT]: '折扣',
  [RewardType.FREE_SHIPPING]: '免运费',
  [RewardType.GIFT]: '赠品',
  [RewardType.VOUCHER]: '代金券'
}

// ========== 校验维度（功能点4多维度校验） ==========
export enum CampaignCheckDimension {
  TIME_FIT = 'time_fit',
  REWARD_COMPLIANCE = 'reward_compliance',
  RULE_RATIONALITY = 'rule_rationality',
  DUPLICATE = 'duplicate',
  VIOLATION = 'violation',
  CONFIG_COMPLETE = 'config_complete',
  PARTICIPATION_THRESHOLD = 'participation_threshold'
}

export const CAMPAIGN_CHECK_DIMENSION_NAMES: Record<string, string> = {
  [CampaignCheckDimension.TIME_FIT]: '时间适配性',
  [CampaignCheckDimension.REWARD_COMPLIANCE]: '奖励合规性',
  [CampaignCheckDimension.RULE_RATIONALITY]: '规则合理性',
  [CampaignCheckDimension.DUPLICATE]: '重复性',
  [CampaignCheckDimension.VIOLATION]: '违规营销',
  [CampaignCheckDimension.CONFIG_COMPLETE]: '配置完整性',
  [CampaignCheckDimension.PARTICIPATION_THRESHOLD]: '参与门槛'
}

// ========== 校验结果等级 ==========
export enum CheckResultLevel {
  PASS = 'pass',
  WARNING = 'warning',
  ERROR = 'error',
  BLOCKER = 'blocker'
}

export const CHECK_RESULT_LEVEL_NAMES: Record<string, string> = {
  [CheckResultLevel.PASS]: '通过',
  [CheckResultLevel.WARNING]: '警告',
  [CheckResultLevel.ERROR]: '错误',
  [CheckResultLevel.BLOCKER]: '阻断'
}

// ========== 审计日志变更类型 ==========
export enum CampaignAuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  CONFIG_CHANGED = 'config_changed',
  REWARD_CHANGED = 'reward_changed',
  PARTICIPATION_CHANGED = 'participation_changed',
  BATCH_CREATED = 'batch_created',
  BATCH_UPDATED = 'batch_updated',
  BATCH_TOGGLED = 'batch_toggled',
  LAUNCH_BLOCKED = 'launch_blocked',
  FORCE_LAUNCHED = 'force_launched'
}

export const CAMPAIGN_AUDIT_ACTION_NAMES: Record<string, string> = {
  [CampaignAuditAction.CREATED]: '活动创建',
  [CampaignAuditAction.UPDATED]: '活动修改',
  [CampaignAuditAction.STATUS_CHANGED]: '状态变更',
  [CampaignAuditAction.CONFIG_CHANGED]: '配置变更',
  [CampaignAuditAction.REWARD_CHANGED]: '奖励规则变更',
  [CampaignAuditAction.PARTICIPATION_CHANGED]: '参与范围变更',
  [CampaignAuditAction.BATCH_CREATED]: '批量创建',
  [CampaignAuditAction.BATCH_UPDATED]: '批量修改',
  [CampaignAuditAction.BATCH_TOGGLED]: '批量启停',
  [CampaignAuditAction.LAUNCH_BLOCKED]: '上线拦截',
  [CampaignAuditAction.FORCE_LAUNCHED]: '强制上线'
}

// ========== 批量操作类型（功能点3） ==========
export enum CampaignBatchAction {
  BATCH_CREATE = 'batch_create',
  BATCH_UPDATE = 'batch_update',
  BATCH_ONLINE = 'batch_online',
  BATCH_OFFLINE = 'batch_offline',
  BATCH_TOGGLE = 'batch_toggle',
  BATCH_DELETE = 'batch_delete'
}

export const CAMPAIGN_BATCH_ACTION_NAMES: Record<string, string> = {
  [CampaignBatchAction.BATCH_CREATE]: '批量创建',
  [CampaignBatchAction.BATCH_UPDATE]: '批量修改',
  [CampaignBatchAction.BATCH_ONLINE]: '批量上线',
  [CampaignBatchAction.BATCH_OFFLINE]: '批量下线',
  [CampaignBatchAction.BATCH_TOGGLE]: '批量启停',
  [CampaignBatchAction.BATCH_DELETE]: '批量删除'
}

// ========== 营销违规关键词 ==========
export const CAMPAIGN_VIOLATION_KEYWORDS = [
  '最高奖',
  '唯一',
  '第一',
  '100%中奖',
  '零成本',
  '无门槛中奖',
  '国家认证',
  '权威推荐',
  '绝对',
  '永久',
  '保本',
  '无风险',
  '稳赚',
  '国家级',
  '世界级'
]

// ========== 奖励配比合理范围（按活动类型） ==========
export const CAMPAIGN_REWARD_RATIO_LIMITS: Record<string, { minRatio: number; maxRatio: number; maxAmount: number }> = {
  [CampaignType.PROMOTION]: { minRatio: 0.01, maxRatio: 0.5, maxAmount: 10000 },
  [CampaignType.DELIVERY]: { minRatio: 0.005, maxRatio: 0.3, maxAmount: 5000 },
  [CampaignType.LUCKY_DRAW]: { minRatio: 0.02, maxRatio: 0.8, maxAmount: 50000 },
  [CampaignType.REBATE]: { minRatio: 0.01, maxRatio: 0.3, maxAmount: 2000 },
  [CampaignType.SIGN_IN]: { minRatio: 0.001, maxRatio: 0.1, maxAmount: 500 },
  [CampaignType.CUSTOM]: { minRatio: 0, maxRatio: 1, maxAmount: 100000 }
}

// ============================================================
// ========== 营销活动 - 用户参与管控模块枚举 ==================
// ============================================================

// ========== 参与状态机（功能点2核心） ==========
export enum ParticipationStatus {
  PENDING_PARTICIPATE = 0,
  TASK_COMPLETED = 1,
  PENDING_REWARD = 2,
  REWARDED = 3,
  INVALID = 4,
  CANCELLED = 5,
  UNDER_REVIEW = 6
}

export const PARTICIPATION_STATUS_NAMES: Record<number, string> = {
  [ParticipationStatus.PENDING_PARTICIPATE]: '待参与',
  [ParticipationStatus.TASK_COMPLETED]: '任务完成',
  [ParticipationStatus.PENDING_REWARD]: '待领奖',
  [ParticipationStatus.REWARDED]: '已领奖',
  [ParticipationStatus.INVALID]: '无效资格',
  [ParticipationStatus.CANCELLED]: '已取消',
  [ParticipationStatus.UNDER_REVIEW]: '审核中'
}

export const PARTICIPATION_STATUS_COLORS: Record<number, string> = {
  [ParticipationStatus.PENDING_PARTICIPATE]: '#909399',
  [ParticipationStatus.TASK_COMPLETED]: '#409eff',
  [ParticipationStatus.PENDING_REWARD]: '#e6a23c',
  [ParticipationStatus.REWARDED]: '#67c23a',
  [ParticipationStatus.INVALID]: '#f56c6c',
  [ParticipationStatus.CANCELLED]: '#c0c4cc',
  [ParticipationStatus.UNDER_REVIEW]: '#909399'
}

// ========== 参与资格校验维度（功能点1 + 功能点4多维度） ==========
export enum ParticipationCheckDimension {
  ACCOUNT_STATUS = 'account_status',
  PUNISHMENT_ACTIVE = 'punishment_active',
  FLOW_LIMIT = 'flow_limit',
  ACTIVITY_TIME = 'activity_time',
  USER_LEVEL = 'user_level',
  ACTIVITY_LEVEL = 'activity_level',
  RISK_LEVEL = 'risk_level',
  REAL_NAME = 'real_name',
  PHONE_VERIFIED = 'phone_verified',
  PARTICIPATION_COUNT = 'participation_count',
  GLOBAL_FREQUENCY = 'global_frequency',
  SAME_DEVICE = 'same_device',
  SAME_IP = 'same_ip',
  TASK_VALIDITY = 'task_validity',
  DATA_CONSISTENCY = 'data_consistency',
  SUSPICIOUS_PATTERN = 'suspicious_pattern'
}

export const PARTICIPATION_CHECK_DIMENSION_NAMES: Record<string, string> = {
  [ParticipationCheckDimension.ACCOUNT_STATUS]: '账号状态',
  [ParticipationCheckDimension.PUNISHMENT_ACTIVE]: '处罚生效中',
  [ParticipationCheckDimension.FLOW_LIMIT]: '账号限流',
  [ParticipationCheckDimension.ACTIVITY_TIME]: '活动时段',
  [ParticipationCheckDimension.USER_LEVEL]: '用户等级门槛',
  [ParticipationCheckDimension.ACTIVITY_LEVEL]: '活跃度门槛',
  [ParticipationCheckDimension.RISK_LEVEL]: '风险等级',
  [ParticipationCheckDimension.REAL_NAME]: '实名认证',
  [ParticipationCheckDimension.PHONE_VERIFIED]: '手机号绑定',
  [ParticipationCheckDimension.PARTICIPATION_COUNT]: '单活动参与次数',
  [ParticipationCheckDimension.GLOBAL_FREQUENCY]: '全局参与频率',
  [ParticipationCheckDimension.SAME_DEVICE]: '同设备参与',
  [ParticipationCheckDimension.SAME_IP]: '同IP参与',
  [ParticipationCheckDimension.TASK_VALIDITY]: '任务完成有效性',
  [ParticipationCheckDimension.DATA_CONSISTENCY]: '数据一致性',
  [ParticipationCheckDimension.SUSPICIOUS_PATTERN]: '可疑参与模式'
}

// ========== 参与违规类型（功能点4自动拦截） ==========
export enum ParticipationViolationType {
  BRUSH_PARTICIPATION = 'brush_participation',
  FAKE_PARTICIPATION = 'fake_participation',
  PROXY_PARTICIPATION = 'proxy_participation',
  MULTI_ACCOUNT = 'multi_account',
  SAME_DEVICE_MULTI = 'same_device_multi',
  SAME_IP_MULTI = 'same_ip_multi',
  FRAUD_TASK = 'fraud_task',
  INVALID_DATA = 'invalid_data',
  ABNORMAL_FREQUENCY = 'abnormal_frequency',
  VIOLATION_USER = 'violation_user'
}

export const PARTICIPATION_VIOLATION_TYPE_NAMES: Record<string, string> = {
  [ParticipationViolationType.BRUSH_PARTICIPATION]: '刷参与量',
  [ParticipationViolationType.FAKE_PARTICIPATION]: '虚假参与',
  [ParticipationViolationType.PROXY_PARTICIPATION]: '违规代参与',
  [ParticipationViolationType.MULTI_ACCOUNT]: '多账号串通',
  [ParticipationViolationType.SAME_DEVICE_MULTI]: '同设备多账号',
  [ParticipationViolationType.SAME_IP_MULTI]: '同IP多账号',
  [ParticipationViolationType.FRAUD_TASK]: '任务造假',
  [ParticipationViolationType.INVALID_DATA]: '数据无效',
  [ParticipationViolationType.ABNORMAL_FREQUENCY]: '异常频率',
  [ParticipationViolationType.VIOLATION_USER]: '违规用户参与'
}

// ========== 参与批量操作类型（功能点3） ==========
export enum ParticipationBatchAction {
  BATCH_APPROVE = 'batch_approve',
  BATCH_REJECT = 'batch_reject',
  BATCH_REMOVE = 'batch_remove',
  BATCH_RESET = 'batch_reset',
  BATCH_INVALID = 'batch_invalid',
  BATCH_RESTORE = 'batch_restore'
}

export const PARTICIPATION_BATCH_ACTION_NAMES: Record<string, string> = {
  [ParticipationBatchAction.BATCH_APPROVE]: '批量审核通过',
  [ParticipationBatchAction.BATCH_REJECT]: '批量审核拒绝',
  [ParticipationBatchAction.BATCH_REMOVE]: '批量剔除违规',
  [ParticipationBatchAction.BATCH_RESET]: '批量重置资格',
  [ParticipationBatchAction.BATCH_INVALID]: '批量标记无效',
  [ParticipationBatchAction.BATCH_RESTORE]: '批量恢复资格'
}

// ========== 参与审计动作类型（功能点4溯源） ==========
export enum ParticipationAuditAction {
  SIGNED_UP = 'signed_up',
  SIGNUP_BLOCKED = 'signup_blocked',
  STATUS_CHANGED = 'status_changed',
  TASK_COMPLETED = 'task_completed',
  TASK_REJECTED = 'task_rejected',
  REWARD_GRANTED = 'reward_granted',
  REWARD_BLOCKED = 'reward_blocked',
  MANUAL_APPROVED = 'manual_approved',
  MANUAL_REJECTED = 'manual_rejected',
  MANUAL_REMOVED = 'manual_removed',
  MANUAL_RESET = 'manual_reset',
  BATCH_APPROVED = 'batch_approved',
  BATCH_REJECTED = 'batch_rejected',
  BATCH_REMOVED = 'batch_removed',
  BATCH_RESET = 'batch_reset',
  AUTO_INVALID = 'auto_invalid',
  ANOMALY_DETECTED = 'anomaly_detected',
  INVALID_CLEARED = 'invalid_cleared'
}

export const PARTICIPATION_AUDIT_ACTION_NAMES: Record<string, string> = {
  [ParticipationAuditAction.SIGNED_UP]: '用户报名',
  [ParticipationAuditAction.SIGNUP_BLOCKED]: '报名被拦截',
  [ParticipationAuditAction.STATUS_CHANGED]: '参与状态变更',
  [ParticipationAuditAction.TASK_COMPLETED]: '任务完成',
  [ParticipationAuditAction.TASK_REJECTED]: '任务审核驳回',
  [ParticipationAuditAction.REWARD_GRANTED]: '奖励发放',
  [ParticipationAuditAction.REWARD_BLOCKED]: '奖励发放拦截',
  [ParticipationAuditAction.MANUAL_APPROVED]: '人工审核通过',
  [ParticipationAuditAction.MANUAL_REJECTED]: '人工审核拒绝',
  [ParticipationAuditAction.MANUAL_REMOVED]: '人工剔除',
  [ParticipationAuditAction.MANUAL_RESET]: '人工重置资格',
  [ParticipationAuditAction.BATCH_APPROVED]: '批量审核通过',
  [ParticipationAuditAction.BATCH_REJECTED]: '批量审核拒绝',
  [ParticipationAuditAction.BATCH_REMOVED]: '批量剔除违规',
  [ParticipationAuditAction.BATCH_RESET]: '批量重置资格',
  [ParticipationAuditAction.AUTO_INVALID]: '系统自动标记无效',
  [ParticipationAuditAction.ANOMALY_DETECTED]: '异常检测触发',
  [ParticipationAuditAction.INVALID_CLEARED]: '无效数据清理'
}

// ========== 任务完成状态 ==========
export enum TaskCompletionStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  SUBMITTED = 2,
  VERIFIED = 3,
  REJECTED = 4
}

export const TASK_COMPLETION_STATUS_NAMES: Record<number, string> = {
  [TaskCompletionStatus.NOT_STARTED]: '未开始',
  [TaskCompletionStatus.IN_PROGRESS]: '进行中',
  [TaskCompletionStatus.SUBMITTED]: '已提交',
  [TaskCompletionStatus.VERIFIED]: '已验证',
  [TaskCompletionStatus.REJECTED]: '已驳回'
}

// ========== 参与反作弊 - 频率限制常量 ==========
export const PARTICIPATION_ANTI_FRAUD_RULES = {
  SINGLE_ACTIVITY_MAX_PER_USER: 1,
  GLOBAL_PARTICIPATIONS_PER_HOUR: 20,
  SAME_DEVICE_MAX_PARTICIPATIONS: 3,
  SAME_IP_MAX_PARTICIPATIONS: 10,
  MIN_TASK_DURATION_SECONDS: 5,
  BRUSH_PATTERN_WINDOW_MINUTES: 10,
  BRUSH_PATTERN_THRESHOLD: 5
}
