export enum CouponType {
  FULL_REDUCTION = 1,
  DISCOUNT = 2,
  FIXED_AMOUNT = 3
}

export const CouponTypeMap: Record<number, string> = {
  [CouponType.FULL_REDUCTION]: '满减',
  [CouponType.DISCOUNT]: '折扣',
  [CouponType.FIXED_AMOUNT]: '立减'
}

export enum CampaignScene {
  NEW_USER_GIFT = 1,
  HOLIDAY_GIFT = 2,
  TRAVEL_SUBSIDY = 3,
  RECALL_WELFARE = 4
}

export const CampaignSceneMap: Record<number, string> = {
  [CampaignScene.NEW_USER_GIFT]: '新人礼',
  [CampaignScene.HOLIDAY_GIFT]: '节日礼',
  [CampaignScene.TRAVEL_SUBSIDY]: '出行补贴',
  [CampaignScene.RECALL_WELFARE]: '召回福利'
}

export const CampaignSceneColorMap: Record<number, string> = {
  [CampaignScene.NEW_USER_GIFT]: '#67c23a',
  [CampaignScene.HOLIDAY_GIFT]: '#e6a23c',
  [CampaignScene.TRAVEL_SUBSIDY]: '#409eff',
  [CampaignScene.RECALL_WELFARE]: '#909399'
}

export const CampaignSceneGradientMap: Record<number, string> = {
  [CampaignScene.NEW_USER_GIFT]: 'linear-gradient(135deg, #67c23a 0%, #85ce61 100%)',
  [CampaignScene.HOLIDAY_GIFT]: 'linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%)',
  [CampaignScene.TRAVEL_SUBSIDY]: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
  [CampaignScene.RECALL_WELFARE]: 'linear-gradient(135deg, #909399 0%, #a6a9ad 100%)'
}

export enum CampaignType {
  NEW_USER = 1,
  HOLIDAY = 2,
  PEAK_SUBSIDY = 3,
  VIP_EXCLUSIVE = 4
}

export const CampaignTypeMap: Record<number, string> = {
  [CampaignType.NEW_USER]: '新用户',
  [CampaignType.HOLIDAY]: '节日',
  [CampaignType.PEAK_SUBSIDY]: '高峰补贴',
  [CampaignType.VIP_EXCLUSIVE]: '会员专享'
}

export enum CampaignStatus {
  DRAFT = 0,
  PENDING = 1,
  RUNNING = 2,
  PAUSED = 3,
  FINISHED = 4,
  OFFLINE = 5
}

export const CampaignStatusMap: Record<number, string> = {
  [CampaignStatus.DRAFT]: '草稿',
  [CampaignStatus.PENDING]: '待生效',
  [CampaignStatus.RUNNING]: '进行中',
  [CampaignStatus.PAUSED]: '已暂停',
  [CampaignStatus.FINISHED]: '已结束',
  [CampaignStatus.OFFLINE]: '已下线'
}

export const CampaignStatusColorMap: Record<number, string> = {
  [CampaignStatus.DRAFT]: '#909399',
  [CampaignStatus.PENDING]: '#e6a23c',
  [CampaignStatus.RUNNING]: '#67c23a',
  [CampaignStatus.PAUSED]: '#f56c6c',
  [CampaignStatus.FINISHED]: '#409eff',
  [CampaignStatus.OFFLINE]: '#c0c4cc'
}

export enum TargetUser {
  ALL = 1,
  NEW_USER = 2,
  OLD_USER = 3,
  INACTIVE_USER = 4,
  HIGH_VALUE_USER = 5
}

export const TargetUserMap: Record<number, string> = {
  [TargetUser.ALL]: '全部用户',
  [TargetUser.NEW_USER]: '新用户',
  [TargetUser.OLD_USER]: '老用户',
  [TargetUser.INACTIVE_USER]: '流失用户',
  [TargetUser.HIGH_VALUE_USER]: '高价值用户'
}

export const TargetUserColorMap: Record<number, string> = {
  [TargetUser.ALL]: '#409eff',
  [TargetUser.NEW_USER]: '#67c23a',
  [TargetUser.OLD_USER]: '#e6a23c',
  [TargetUser.INACTIVE_USER]: '#909399',
  [TargetUser.HIGH_VALUE_USER]: '#f56c6c'
}

export enum CityTier {
  TIER_1 = 1,
  TIER_2 = 2,
  TIER_3 = 3,
  TIER_4 = 4
}

export const CityTierMap: Record<number, string> = {
  [CityTier.TIER_1]: '一线城市',
  [CityTier.TIER_2]: '二线城市',
  [CityTier.TIER_3]: '三线城市',
  [CityTier.TIER_4]: '四线及以下'
}

export const Tier1Cities = ['北京', '上海', '广州', '深圳']
export const Tier2Cities = [
  '杭州', '南京', '苏州', '成都', '武汉', '西安', '重庆', '天津',
  '长沙', '郑州', '青岛', '大连', '宁波', '厦门', '合肥', '福州'
]
export const Tier3Cities = [
  '济南', '沈阳', '长春', '哈尔滨', '石家庄', '太原', '南昌', '昆明',
  '贵阳', '兰州', '南宁', '海口', '银川', '西宁', '乌鲁木齐', '呼和浩特'
]

export const AllCities = [...Tier1Cities, ...Tier2Cities, ...Tier3Cities]

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  ONLINE = 'online',
  OFFLINE = 'offline',
  COPY = 'copy',
  DELETE = 'delete',
  VALIDATE = 'validate',
  BATCH_ONLINE = 'batch_online',
  BATCH_OFFLINE = 'batch_offline',
  BATCH_UPDATE = 'batch_update',
  BATCH_COPY = 'batch_copy'
}

export const AuditActionMap: Record<string, string> = {
  [AuditAction.CREATE]: '创建活动',
  [AuditAction.UPDATE]: '修改活动',
  [AuditAction.ONLINE]: '上线活动',
  [AuditAction.OFFLINE]: '下线活动',
  [AuditAction.COPY]: '复制活动',
  [AuditAction.DELETE]: '删除活动',
  [AuditAction.VALIDATE]: '校验拦截',
  [AuditAction.BATCH_ONLINE]: '批量上线',
  [AuditAction.BATCH_OFFLINE]: '批量下线',
  [AuditAction.BATCH_UPDATE]: '批量修改',
  [AuditAction.BATCH_COPY]: '批量复制'
}

export enum RiskLevel {
  NORMAL = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const RiskLevelMap: Record<number, string> = {
  [RiskLevel.NORMAL]: '正常',
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险'
}

export const RiskLevelColorMap: Record<number, string> = {
  [RiskLevel.NORMAL]: '#67c23a',
  [RiskLevel.LOW]: '#909399',
  [RiskLevel.MEDIUM]: '#e6a23c',
  [RiskLevel.HIGH]: '#f56c6c'
}

export enum AudiencePurpose {
  CUSTOM = 0,
  ACQUISITION = 1,
  ACTIVATION = 2,
  RETENTION = 3
}

export const AudiencePurposeMap: Record<number, string> = {
  [AudiencePurpose.CUSTOM]: '自定义',
  [AudiencePurpose.ACQUISITION]: '拉新',
  [AudiencePurpose.ACTIVATION]: '促活',
  [AudiencePurpose.RETENTION]: '维稳'
}

export const AudiencePurposeColorMap: Record<number, string> = {
  [AudiencePurpose.CUSTOM]: '#909399',
  [AudiencePurpose.ACQUISITION]: '#67c23a',
  [AudiencePurpose.ACTIVATION]: '#409eff',
  [AudiencePurpose.RETENTION]: '#e6a23c'
}

export const AudiencePurposeGradientMap: Record<number, string> = {
  [AudiencePurpose.CUSTOM]: 'linear-gradient(135deg, #909399 0%, #a6a9ad 100%)',
  [AudiencePurpose.ACQUISITION]: 'linear-gradient(135deg, #67c23a 0%, #85ce61 100%)',
  [AudiencePurpose.ACTIVATION]: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
  [AudiencePurpose.RETENTION]: 'linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%)'
}

export enum AudienceAction {
  PREVIEW = 'preview',
  RULE_UPDATE = 'rule_update',
  PURPOSE_UPDATE = 'purpose_update',
  IMPORT = 'import',
  EXCLUDE = 'exclude',
  TAG_UPDATE = 'tag_update',
  WEIGHT_UPDATE = 'weight_update',
  CHECK = 'check',
  PARTICIPATE = 'participate',
  VERIFY = 'verify',
  FRAUD = 'fraud',
  INVALID_PARTICIPATION = 'invalid_participation'
}

export const AudienceActionMap: Record<string, string> = {
  [AudienceAction.PREVIEW]: '人群预览',
  [AudienceAction.RULE_UPDATE]: '规则变更',
  [AudienceAction.PURPOSE_UPDATE]: '策略切换',
  [AudienceAction.IMPORT]: '批量导入',
  [AudienceAction.EXCLUDE]: '批量剔除',
  [AudienceAction.TAG_UPDATE]: '标签更新',
  [AudienceAction.WEIGHT_UPDATE]: '权重配置',
  [AudienceAction.CHECK]: '规则校验',
  [AudienceAction.PARTICIPATE]: '用户参与',
  [AudienceAction.VERIFY]: '资格校验',
  [AudienceAction.FRAUD]: '恶意拦截',
  [AudienceAction.INVALID_PARTICIPATION]: '无效参与拦截'
}

export const AudienceActionColorMap: Record<string, string> = {
  [AudienceAction.PREVIEW]: '#409eff',
  [AudienceAction.RULE_UPDATE]: '#e6a23c',
  [AudienceAction.PURPOSE_UPDATE]: '#909399',
  [AudienceAction.IMPORT]: '#67c23a',
  [AudienceAction.EXCLUDE]: '#f56c6c',
  [AudienceAction.TAG_UPDATE]: '#8e44ad',
  [AudienceAction.WEIGHT_UPDATE]: '#bb6bd9',
  [AudienceAction.CHECK]: '#409eff',
  [AudienceAction.PARTICIPATE]: '#67c23a',
  [AudienceAction.VERIFY]: '#e6a23c',
  [AudienceAction.FRAUD]: '#f56c6c',
  [AudienceAction.INVALID_PARTICIPATION]: '#f56c6c'
}

export enum EfficiencyLevel {
  NOT_RATED = 0,
  INEFFICIENT = 1,
  NORMAL = 2,
  GOOD = 3,
  EXCELLENT = 4,
  S = 5
}

export const EfficiencyLevelMap: Record<number, string> = {
  [EfficiencyLevel.NOT_RATED]: '未评级',
  [EfficiencyLevel.INEFFICIENT]: '低效',
  [EfficiencyLevel.NORMAL]: '一般',
  [EfficiencyLevel.GOOD]: '良好',
  [EfficiencyLevel.EXCELLENT]: '优秀',
  [EfficiencyLevel.S]: 'S级'
}

export const EfficiencyLevelColorMap: Record<number, string> = {
  [EfficiencyLevel.NOT_RATED]: '#c0c4cc',
  [EfficiencyLevel.INEFFICIENT]: '#909399',
  [EfficiencyLevel.NORMAL]: '#409eff',
  [EfficiencyLevel.GOOD]: '#67c23a',
  [EfficiencyLevel.EXCELLENT]: '#f56c6c',
  [EfficiencyLevel.S]: '#ff0050'
}

export const EfficiencyLevelGradientMap: Record<number, string> = {
  [EfficiencyLevel.NOT_RATED]: 'linear-gradient(135deg, #c0c4cc 0%, #d3d4d6 100%)',
  [EfficiencyLevel.INEFFICIENT]: 'linear-gradient(135deg, #909399 0%, #a6a9ad 100%)',
  [EfficiencyLevel.NORMAL]: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
  [EfficiencyLevel.GOOD]: 'linear-gradient(135deg, #67c23a 0%, #85ce61 100%)',
  [EfficiencyLevel.EXCELLENT]: 'linear-gradient(135deg, #f56c6c 0%, #f78989 100%)',
  [EfficiencyLevel.S]: 'linear-gradient(135deg, #ff0050 0%, #ff4785 100%)'
}

export enum DataAuthenticity {
  PENDING = 1,
  REAL = 2,
  SUSPICIOUS = 3,
  FAKE = 4
}

export const DataAuthenticityMap: Record<number, string> = {
  [DataAuthenticity.PENDING]: '待校验',
  [DataAuthenticity.REAL]: '真实',
  [DataAuthenticity.SUSPICIOUS]: '疑似造假',
  [DataAuthenticity.FAKE]: '确认造假'
}

export const DataAuthenticityColorMap: Record<number, string> = {
  [DataAuthenticity.PENDING]: '#909399',
  [DataAuthenticity.REAL]: '#67c23a',
  [DataAuthenticity.SUSPICIOUS]: '#e6a23c',
  [DataAuthenticity.FAKE]: '#f56c6c'
}

export enum FunnelStage {
  IMPRESSION = 'impression',
  CLICK = 'click',
  PARTICIPATE = 'participate',
  RECEIVE = 'receive',
  USE = 'use',
  CONVERSION = 'conversion'
}

export const FunnelStageMap: Record<string, { label: string; color: string; icon: string }> = {
  [FunnelStage.IMPRESSION]: { label: '活动曝光', color: '#66b1ff', icon: 'View' },
  [FunnelStage.CLICK]:      { label: '点击进入', color: '#67c23a', icon: 'Pointer' },
  [FunnelStage.PARTICIPATE]:{ label: '参与活动', color: '#e6a23c', icon: 'UserFilled' },
  [FunnelStage.RECEIVE]:    { label: '领取权益', color: '#8e44ad', icon: 'Present' },
  [FunnelStage.USE]:        { label: '核销使用', color: '#f56c6c', icon: 'Tickets' },
  [FunnelStage.CONVERSION]: { label: '订单转化', color: '#ff0050', icon: 'Goods' }
}

export enum SuggestionType {
  ROI = 'roi',
  REDEMPTION = 'redemption',
  CONVERSION = 'conversion',
  CTR = 'ctr',
  BUDGET = 'budget',
  FRAUD = 'fraud',
  STRATEGY = 'strategy',
  TEMPLATE = 'template'
}

export const SuggestionLevel: Record<string, string> = {
  danger: '高优先级',
  warning: '中优先级',
  info: '低优先级',
  success: '正向建议'
}

export enum ExportFieldGroup {
  BASIC = 'basic',
  FINANCE = 'finance',
  METRICS = 'metrics',
  RATING = 'rating',
  META = 'meta'
}

export const ExportFieldGroupMap: Record<string, string> = {
  [ExportFieldGroup.BASIC]: '活动基础信息',
  [ExportFieldGroup.FINANCE]: '财务与预算',
  [ExportFieldGroup.METRICS]: '效果指标',
  [ExportFieldGroup.RATING]: '评级与模板',
  [ExportFieldGroup.META]: '创建信息'
}

export const SceneDefaultConfig: Record<number, Record<string, any>> = {
  [CampaignScene.NEW_USER_GIFT]: {
    targetUser: TargetUser.NEW_USER,
    perUserLimit: 1,
    perDayLimit: 0,
    mutuallyExclusive: 1,
    subsidyAmount: 10,
    maxSubsidyPerOrder: 10,
    minOrderAmount: 0,
    exclusiveScenes: [CampaignScene.HOLIDAY_GIFT, CampaignScene.TRAVEL_SUBSIDY, CampaignScene.RECALL_WELFARE],
    description: '新用户注册后首次下单专享优惠'
  },
  [CampaignScene.HOLIDAY_GIFT]: {
    targetUser: TargetUser.ALL,
    perUserLimit: 3,
    perDayLimit: 1,
    mutuallyExclusive: 1,
    subsidyAmount: 15,
    maxSubsidyPerOrder: 20,
    minOrderAmount: 30,
    exclusiveScenes: [CampaignScene.NEW_USER_GIFT, CampaignScene.TRAVEL_SUBSIDY, CampaignScene.RECALL_WELFARE],
    description: '节假日专属福利活动'
  },
  [CampaignScene.TRAVEL_SUBSIDY]: {
    targetUser: TargetUser.ALL,
    perUserLimit: 10,
    perDayLimit: 2,
    mutuallyExclusive: 1,
    subsidyAmount: 5,
    maxSubsidyPerOrder: 10,
    minOrderAmount: 15,
    exclusiveScenes: [CampaignScene.NEW_USER_GIFT, CampaignScene.HOLIDAY_GIFT, CampaignScene.RECALL_WELFARE],
    description: '日常出行普惠补贴'
  },
  [CampaignScene.RECALL_WELFARE]: {
    targetUser: TargetUser.INACTIVE_USER,
    perUserLimit: 2,
    perDayLimit: 0,
    mutuallyExclusive: 1,
    subsidyAmount: 20,
    maxSubsidyPerOrder: 25,
    minOrderAmount: 25,
    inactiveDays: 15,
    exclusiveScenes: [CampaignScene.NEW_USER_GIFT, CampaignScene.HOLIDAY_GIFT, CampaignScene.TRAVEL_SUBSIDY],
    description: '召回流失用户专属福利'
  }
}
