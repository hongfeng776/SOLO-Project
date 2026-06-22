export interface Coupon {
  id: number;
  name: string;
  code: string;
  type: number;
  discount: number;
  minAmount: number;
  totalCount: number;
  usedCount: number;
  perLimit: number;
  startTime: string;
  endTime: string;
  status: number;
  description: string;
  createTime: string;
  updateTime: string
}

export interface CityTierConfig {
  tier1?: {
    subsidyAmount?: number;
    maxSubsidyPerOrder?: number;
    discountRate?: number;
    perUserLimit?: number;
  };
  tier2?: {
    subsidyAmount?: number;
    maxSubsidyPerOrder?: number;
    discountRate?: number;
    perUserLimit?: number;
  };
  tier3?: {
    subsidyAmount?: number;
    maxSubsidyPerOrder?: number;
    discountRate?: number;
    perUserLimit?: number;
  };
  tier4?: {
    subsidyAmount?: number;
    maxSubsidyPerOrder?: number;
    discountRate?: number;
    perUserLimit?: number;
  }
}

export interface MarketingCampaign {
  id: number;
  name: string;
  code: string;
  scene: number;
  type: number;
  couponId: number | null;
  subsidyAmount: number;
  maxSubsidyPerOrder: number;
  discountRate: number;
  budget: number;
  usedBudget: number;
  dailyBudget: number;
  startTime: string;
  endTime: string;
  targetUser: number;
  userLevelMin: number;
  registerDaysMin: number;
  registerDaysMax: number;
  inactiveDays: number;
  cities: string[] | null;
  cityTierConfig: CityTierConfig | null;
  vehicleTypes: number[] | null;
  minOrderAmount: number;
  perUserLimit: number;
  perDayLimit: number;
  totalCount: number;
  mutuallyExclusive: number;
  exclusiveScenes: number[] | null;
  rules: any;
  status: number;
  participantCount: number;
  orderCount: number;
  receiveCount: number;
  useCount: number;
  sourceCampaignId: number | null;
  campaignPurpose: number;
  audiencePurpose: number;
  userTags: string[] | null;
  excludeUserTags: string[] | null;
  activityLevels: number[] | null;
  consumptionLevels: number[] | null;
  userLevels: number[] | null;
  userLevelsMin: number;
  userLevelsMax: number;
  excludeHighRisk: number;
  excludeBlocked: number;
  excludeInactive: number;
  registerChannels: string[] | null;
  provinces: string[] | null;
  audienceCityTiers: number[] | null;
  audienceRules: any;
  userWeights: any;
  targetedUserIds: number[] | null;
  excludedUserIds: number[] | null;
  audienceCoverage: AudiencePreview | null;
  audienceVersion: number;
  creatorId: number | null;
  creatorName: string | null;
  onlineTime: string | null;
  offlineTime: string | null;
  description: string | null;
  createTime: string;
  updateTime: string
}

export interface ValidateError {
  field: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  blocking: boolean;
  code: string;
  message: string;
  detail?: string[]
}

export interface ValidatePassed {
  field: string;
  message: string
}

export interface ValidateResult {
  valid: boolean;
  riskLevel: number;
  errors: ValidateError[];
  warnings: ValidateError[];
  passed: ValidatePassed[];
  summary: {
    totalChecks: number;
    errorCount: number;
    warningCount: number;
    passCount: number
  }
}

export interface AuditDiffField {
  field: string;
  fieldLabel: string;
  before: any;
  after: any
}

export interface MarketingAuditLog {
  id: number;
  campaignId: number;
  campaignName: string;
  action: string;
  actionLabel: string;
  actionIcon: string;
  actionDetail: string | null;
  operatorId: number;
  operatorName: string;
  beforeData: Partial<MarketingCampaign> | null;
  afterData: Partial<MarketingCampaign> | null;
  diffFields: AuditDiffField[] | null;
  validateResult: ValidateResult | null;
  ip: string | null;
  riskLevel: number;
  riskLabel: string;
  riskColor: string;
  remark: string | null;
  createTime: string
}

export interface SceneConfig {
  scene: number;
  name: string;
  maxSubsidy: number;
  maxDiscountRate: number;
  defaultTargetUser: number;
  requiredFields: string[];
  exclusiveScenes: number[];
  maxBudgetPerCity: number
}

export interface BatchOperationResult {
  success: {
    id: number;
    name?: string;
    newId?: number
  }[];
  failed: {
    id: number;
    reason: string
  }[]
}

export interface BatchUpdateParams {
  ids: number[];
  updateFields: Partial<MarketingCampaign>
}

export interface BatchStatusParams {
  ids: number[];
  status: number
}

export interface BatchCopyParams {
  ids: number[];
  nameSuffix?: string
}

export interface AuditQueryParams {
  page?: number;
  pageSize?: number;
  action?: string;
  riskLevel?: number;
  startDate?: string;
  endDate?: string
}

export interface CampaignQueryParams {
  page?: number;
  pageSize?: number;
  scene?: number;
  type?: number;
  status?: number;
  targetUser?: number;
  city?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string
}

export interface CampaignStatistics {
  participantCount: number;
  orderCount: number;
  receiveCount: number;
  useCount: number;
  usedBudget: number;
  budget: number;
  budgetUsage: string;
  dailyBudgetUsage: string | null;
  conversionRate: string
}

export interface RiskStats {
  totalRisk: number;
  totalBlocked: number;
  riskByAction: {
    label: string;
    count: number;
    blocked: number
  }[]
}

export enum AudiencePurpose {
  CUSTOM = 0,
  ACQUISITION = 1,
  ACTIVATION = 2,
  RETENTION = 3
}

export const AudiencePurposeMap: Record<number, string> = {
  [AudiencePurpose.CUSTOM]: '自定义人群',
  [AudiencePurpose.ACQUISITION]: '拉新活动',
  [AudiencePurpose.ACTIVATION]: '促活活动',
  [AudiencePurpose.RETENTION]: '维稳活动'
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
  [AudienceAction.PREVIEW]: '人群覆盖预览',
  [AudienceAction.RULE_UPDATE]: '更新人群规则',
  [AudienceAction.PURPOSE_UPDATE]: '切换人群策略',
  [AudienceAction.IMPORT]: '批量导入定向用户',
  [AudienceAction.EXCLUDE]: '批量剔除无效用户',
  [AudienceAction.TAG_UPDATE]: '批量更新用户标签',
  [AudienceAction.WEIGHT_UPDATE]: '更新参与权重',
  [AudienceAction.CHECK]: '人群定向校验',
  [AudienceAction.PARTICIPATE]: '用户参与活动',
  [AudienceAction.VERIFY]: '用户核销权益',
  [AudienceAction.FRAUD]: '恶意刷活动拦截',
  [AudienceAction.INVALID_PARTICIPATION]: '非定向用户拦截'
}

export const AudienceActionColorMap: Record<string, string> = {
  [AudienceAction.PREVIEW]: '#909399',
  [AudienceAction.RULE_UPDATE]: '#409eff',
  [AudienceAction.PURPOSE_UPDATE]: '#6f7ad7',
  [AudienceAction.IMPORT]: '#67c23a',
  [AudienceAction.EXCLUDE]: '#f56c6c',
  [AudienceAction.TAG_UPDATE]: '#e6a23c',
  [AudienceAction.WEIGHT_UPDATE]: '#8e44ad',
  [AudienceAction.CHECK]: '#909399',
  [AudienceAction.PARTICIPATE]: '#67c23a',
  [AudienceAction.VERIFY]: '#409eff',
  [AudienceAction.FRAUD]: '#f56c6c',
  [AudienceAction.INVALID_PARTICIPATION]: '#e6a23c'
}

export interface UserTagOption {
  value: string;
  label: string;
  color: string
}

export interface AudiencePreview {
  total: number;
  valid: number;
  riskExcluded: number;
  blockedExcluded: number;
  byLevel: { level: number; count: number }[];
  byActivity: { level: number; count: number }[];
  byConsumption: { level: number; count: number }[];
  byCity: { city: string; count: number }[]
}

export interface AudiencePurposeConfig {
  purpose: number;
  name: string;
  desc: string;
  defaultTargetUser: number;
  defaultUserTags: string[] | null;
  defaultActivityLevels: number[] | null;
  defaultConsumptionLevels: number[] | null;
  defaultUserLevels: number[] | null;
  defaultRegisterDaysMax?: number;
  defaultInactiveDays?: number;
  defaultExcludeHighRisk: number;
  defaultExcludeBlocked: number;
  defaultExcludeInactive: number
}

export interface AudienceDiffField {
  field: string;
  before: any;
  after: any;
  type: 'added' | 'removed' | 'modified'
}

export interface AudienceLog {
  id: number;
  campaignId: number;
  action: string;
  actionLabel: string;
  actionColor: string;
  audiencePurpose: number;
  operatorId: number;
  operatorName: string;
  operatorRole?: string;
  ipAddress?: string;
  beforeRule: Partial<MarketingCampaign> | null;
  afterRule: Partial<MarketingCampaign> | null;
  diffFields: AudienceDiffField[] | null;
  affectedCount: number;
  validCount: number;
  excludedRiskCount: number;
  excludedBlockedCount: number;
  excludedInvalidCount: number;
  coveragePreview: AudiencePreview | null;
  weightConfig: any | null;
  riskLevel: number;
  validateResult: ValidateResult | null;
  interceptionReason?: string;
  userId?: number;
  userPhone?: string;
  userLevel?: number;
  tags?: string[];
  remark?: string;
  createdAt: string
}

export interface AudienceLogStats {
  totalAudienceOps: number;
  previewCount: number;
  ruleChangeCount: number;
  interceptCount: number;
  fraudCount: number;
  invalidExcluded: number
}

export interface AudienceLogPage {
  list: AudienceLog[];
  total: number;
  page: number;
  pageSize: number;
  stats: AudienceLogStats
}

export interface AudienceRiskStats {
  totalIntercept: number;
  fraudCount: number;
  invalidParticipation: number;
  totalInvalidExcluded: number;
  totalRiskExcluded: number;
  byAction: {
    action: string;
    label: string;
    color: string;
    count: number;
    blocked: number
  }[]
}

export interface BatchAudienceResult {
  totalImported: number;
  validCount: number;
  excludedRisk: number;
  duplicates: number;
  totalAfter: number;
  sampleUsers: { id: number; phone: string; nickname: string; level: number }[]
}

export interface BatchExcludeResult {
  totalExcluded: number;
  removedFromTargeted: number;
  totalExcludedAfter: number
}

export interface UserEligibilityResult {
  eligible: boolean;
  reason?: string;
  riskLevel: number;
  userId?: number;
  userLevel?: number;
  weight?: number
}

export interface OptimizeSuggestion {
  level: string;
  type: string;
  title: string;
  desc: string;
  priority: number;
}

export interface SubScoreDetail {
  roi: number;
  redemptionRate: number;
  conversionRate: number;
  ctr: number;
  budgetUsage: number;
  audienceMatch: number;
}

export interface EffectMetrics {
  impression: number;
  click: number;
  receive: number;
  use: number;
  participant: number;
  conversion: number;
  gmv: number;
  budget: number;
  usedBudget: number;
  ctrValue: number;
  redemptionRate: number;
  conversionRate: number;
  participationRate: number;
  roiValue: number;
  budgetUsage: number;
  receiveRate: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  minScore: number;
  color: string;
  label: string;
}

export interface AuthenticityCheck {
  type: string;
  pass: boolean;
  desc: string;
}

export interface AuthenticityResult {
  score: number;
  status: number;
  checks: AuthenticityCheck[];
}

export interface EffectEvaluation {
  efficiencyLevel: number;
  efficiencyScore: number;
  roiValue: number;
  ctrValue: number;
  conversionRate: number;
  redemptionRate: number;
  optimizeSuggestions: OptimizeSuggestion[];
  templateTags: string[];
  dataAuthenticity: number;
  authenticityScore: number;
  funnelData: any;
  lastEvaluatedAt: string;
  subScores: SubScoreDetail;
  levelCfg: LevelConfig;
  metrics: EffectMetrics;
  authenticity: AuthenticityResult;
}

export interface EffectStatisticsResult {
  statusValid: boolean;
  campaignStatus: number;
  campaignStart: string;
  campaignEnd: string;
  metrics: EffectMetrics;
  evaluated: EffectEvaluation | null;
  cascadeFilters: string[];
}

export interface FunnelStageRow {
  key: string;
  label: string;
  color: string;
  icon: string;
  value: number;
  displayValue: string;
  conversionPct: number;
  dropPct: number;
  totalRatio: number;
}

export interface LossReason {
  stageKey: string;
  stageLabel: string;
  dropPct: number;
  level: string;
  title: string;
  desc: string;
}

export interface FunnelResult {
  funnel: FunnelStageRow[];
  gmv: number;
  avgOrderValue: number;
  avgAcquisitionCost: number;
  topLossReasons: LossReason[];
}

export interface FraudRecord {
  id: number;
  action: string;
  phone: string;
  rawPhone: string;
  userLevel: number;
  reason: string;
  tags: string[];
  affectedCount: number;
  createdAt: string;
  riskLevel: number;
}

export interface FraudStats {
  totalBlocked: number;
  byType: { key: string; label: string; count: number; color: string }[];
  estimatedSavings: number;
}

export interface FraudPageResult {
  list: FraudRecord[];
  total: number;
  page: number;
  pageSize: number;
  stats: FraudStats;
}

export interface ExportField {
  key: string;
  label: string;
  group: string;
  sensitive?: boolean;
}

export interface ExportConfig {
  fields: ExportField[];
  efficiencyLevels: LevelConfig[];
}

export interface ExportReportResult {
  total: number;
  columns: ExportField[];
  rows: any[];
  maskApplied: boolean;
}

export interface CompareDimension {
  key: string;
  label: string;
  higherBetter: boolean;
}

export interface CompareCampaignItem {
  id: number;
  name: string;
  code: string;
  scene: number;
  audiencePurpose: number;
  status: number;
  metrics: EffectMetrics;
  evaluated: any;
}

export interface CompareResult {
  list: CompareCampaignItem[];
  dimensions: CompareDimension[];
}

export interface InefficientMarkResult {
  marked: number;
  totalIds: number;
}

export interface TemplateToggleResult {
  count: number;
  isTemplate: number;
  templateTags: string[];
}

export interface ComplianceCheckItem {
  type: string;
  name: string;
  passed: boolean;
  message: string;
  detail: string;
}

export interface RedemptionRecord {
  id: number;
  campaignId: number;
  campaignName: string;
  userId: number;
  userPhone: string | null;
  userLevel: number;
  orderId: number | null;
  orderNo: string | null;
  couponId: number | null;
  redemptionCode: string | null;
  status: number;
  auditLevel: number;
  violationType: string;
  complianceChecks: ComplianceCheckItem[];
  complianceScore: number;
  scene: number | null;
  vehicleType: string | null;
  city: string | null;
  redemptionAmount: number;
  orderAmount: number;
  benefitStartTime: string | null;
  benefitEndTime: string | null;
  auditRemark: string | null;
  auditorId: number | null;
  auditorName: string | null;
  auditAt: string | null;
  rejectReason: string | null;
  participateId: number | null;
  participateTime: string | null;
  receiveTime: string | null;
  redemptionTime: string | null;
  ipAddress: string | null;
  deviceId: string | null;
  isRevocable: number;
  revokedAt: string | null;
  revokerName: string | null;
  revokeReason: string | null;
}

export interface PreCheckResult {
  canProceed: boolean;
  reason?: string;
  campaignStatus?: number;
}

export interface SubmitRedemptionResult {
  success: boolean;
  record: RedemptionRecord;
  auditLevel: number;
  auditPath: string;
  complianceScore: number;
  violationType: string;
  autoPassed: boolean;
  reason?: string;
}

export interface ManualReviewResult {
  record: RedemptionRecord;
  action: string;
  newStatus: number;
}

export interface BatchReviewResult {
  approved: number[];
  rejected: number[];
  failed: { id: number; reason: string }[];
}

export interface RedemptionListResult {
  list: RedemptionRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RedemptionStats {
  total: number;
  byStatus: Record<number, number>;
  byViolation: Record<string, number>;
  autoPassCount: number;
  manualReviewCount: number;
  avgComplianceScore: number;
  violationRate: number;
}

export interface TraceTimeline {
  time: string;
  action: string;
  detail: string;
  icon: string;
  color: string;
  checks?: ComplianceCheckItem[];
}

export interface TraceResult {
  record: RedemptionRecord;
  campaign: MarketingCampaign | null;
  timeline: TraceTimeline[];
  violationLabel: string;
  complianceChecks: ComplianceCheckItem[];
  complianceScore: number;
  isViolated: boolean;
}

export interface ViolationRecord {
  id: number;
  campaignId: number;
  campaignName: string;
  userId: number;
  userPhone: string;
  rawPhone: string;
  violationType: string;
  violationLabel: string;
  redemptionAmount: number;
  status: number;
  complianceScore: number;
  redemptionTime: string;
}

export interface ViolationStats {
  totalViolations: number;
  byType: Record<string, number>;
  estimatedSavings: number;
}

export interface ViolationPageResult {
  list: ViolationRecord[];
  total: number;
  page: number;
  pageSize: number;
  stats: ViolationStats;
}

export interface ComplianceOverviewResult {
  total: number;
  complianceScore: number;
  checks: {
    type: string;
    name: string;
    passCount: number;
    failCount: number;
    passRate: number;
  }[];
}

export interface RedemptionConfigResult {
  statusMap: Record<number, string>;
  violationTypes: { value: string; label: string; level: string }[];
  complianceCheckTypes: { type: string; name: string; weight: number }[];
  autoPassThreshold: number;
}
