export interface IApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
}

export interface IPaginatedData<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ILoginParams {
  username: string
  password: string
}

export interface ILoginResult {
  accessToken: string
  refreshToken: string
}

export interface IUserInfo {
  id: number
  username: string
  realName: string
  phone: string
  email: string
  status: number
  roles: IRole[]
  permissions: string[]
  lastLoginTime: string
  lastLoginIp: string
  createdAt: string
  updatedAt: string
}

export interface IRole {
  id: number
  roleName: string
  roleCode: string
  description: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface IPermission {
  id: number
  permName: string
  permCode: string
  permType: string
  parentId: number | null
  path: string
  icon: string
  sortOrder: number
  status: number
  children?: IPermission[]
  createdAt: string
  updatedAt: string
}

export interface IStockQuoteBase {
  id: number
  stockCode: string
  stockName: string
  market: string
  currentPrice: number
  changeAmount: number
  changeRate: number
  openPrice: number
  closePrice: number
  highPrice: number
  lowPrice: number
  volume: number
  turnover: number
  amplitude: number
  peRatio: number
  pbRatio: number
  totalMarketCap: number
  circulateMarketCap: number
  tradeDate: string
}

export interface IStockQuote extends IStockQuoteBase {
  status: string
  sector: string
  rank?: number
  isHot?: boolean
  isRisk?: boolean
  dataSource?: string
  lastSyncAt?: string
  _highPrecision?: boolean
}

export interface IStockValidation {
  valid: boolean
  format: string
  market: string
}

export interface ITradingSession {
  inSession: boolean
  currentPeriod: string
  nextSessionAt: string
  isWeekend: boolean
  isHoliday: boolean
}

export interface IDataSourceStatus {
  overallStatus: string
  healthyCount: number
  totalCount: number
  sources: Array<{ name: string; status: string; latencyMs: number }>
}

export interface IStockHistory {
  list: IStockQuote[]
  stats: {
    peakPrice: number
    valleyPrice: number
    avgPrice: number
    avgVolume: number
    maxChangeRate: number
  }
}

export interface IAssetProduct {
  id: number
  productCode: string
  productName: string
  productType: string
  riskLevel: string
  nav: number
  accNav: number
  dailyYield: number
  annualYield: number
  productStatus: string
  minAmount: number
  maxAmount: number
  manager: string
  custodian: string
  raiseStartDate: string
  raiseEndDate: string
  maturityDate: string
  productDesc: string
}

export interface IValidationError {
  field: string
  message: string
}

export interface IValidationResult {
  valid: boolean
  errors: IValidationError[]
}

export interface IBatchImportResult {
  total: number
  success: number
  failed: number
  duplicate: number
  successList: ICustomerAsset[]
  errorList: Array<{ row: number; data: any; errors: IValidationError[]; type: string }>
  duplicateList: any[]
}

export interface ICustomerAsset {
  id: number
  assetAccountNo?: string
  customerName: string
  customerType: string
  idCard: string
  phone?: string
  email?: string
  address?: string
  filingStatus?: string
  accountStatus?: string
  archiveStatus?: string
  institutionName?: string
  institutionCode?: string
  legalRepresentative?: string
  legalRepIdCard?: string
  businessLicense?: string
  unifiedSocialCredit?: string
  gender?: string
  birthday?: string
  occupation?: string
  workUnit?: string
  education?: string
  maritalStatus?: string
  totalAsset?: number
  availableAmount?: number
  frozenAmount?: number
  totalProfit?: number
  totalCost?: number
  riskLevel?: string
  tradeAccountNo?: string
  initialDeposit?: number
  accountOpenDate?: string
  sourceMaterials?: string
  createdBy?: number
  createdByName?: string
  archiveTime?: string
  lastModifiedBy?: number
  lastModifiedByName?: string
  temporaryExpireAt?: string
  status: string
  remark?: string
  createdAt: string
  updatedAt?: string
}

export interface IFundFlow {
  id: number
  flowNo: string
  customerId: number
  assetId: number
  flowType: string
  amount: number
  balanceAfter: number
  flowStatus: string
  channel: string
  remark: string
  tradeTime: string
}

export interface IComplianceAudit {
  id: number
  auditNo: string
  auditType: string
  auditStatus: string
  targetType: string
  targetId: number
  riskScore: number
  auditorId: number | null
  auditOpinion: string
  auditAt: string | null
}

export interface IPageParams {
  page: number
  pageSize: number
}

export interface ITrade {
  id: number
  tradeNo: string
  customerId: number
  customerName?: string
  stockId: number
  stockCode: string
  stockName: string
  tradeType: string
  tradePrice: number
  tradeQuantity: number
  tradeAmount: number
  commission: number
  stampTax: number
  totalFee: number
  tradeStatus: string
  auditRequired: boolean
  auditorId: number | null
  auditOpinion: string
  auditAt: string | null
  orderAt: string
  dealAt: string | null
  remark: string
  createdAt: string
}

export interface ICustomerHolding {
  id: number
  customerId: number
  customerName?: string
  stockId: number
  stockCode: string
  stockName: string
  totalQuantity: number
  availableQuantity: number
  frozenQuantity: number
  costPrice: number
  totalCost: number
  currentPrice: number
  marketValue: number
  floatingProfit: number
  floatingProfitRate: number
  firstBuyDate: string
  lastTradeDate: string | null
}

export interface IRiskAlert {
  id: number
  alertNo: string
  alertType: string
  alertLevel: string
  alertStatus: string
  customerId: number | null
  customerName?: string
  stockId: number | null
  stockCode?: string
  stockName?: string
  tradeId: number | null
  title: string
  content: string
  riskScore: number
  relatedData?: Record<string, any>
  handlerId: number | null
  handleOpinion: string
  handleAt: string | null
  createdAt: string
}

export interface IOperationLog {
  id: number
  logType: string
  userId: number | null
  username: string
  module: string
  action: string
  targetType: string | null
  targetId: number | null
  requestParams?: Record<string, any>
  responseData?: Record<string, any>
  ipAddress: string
  userAgent: string
  status: string
  errorMessage: string
  durationMs: number
  createdAt: string
}

export interface IDashboardStats {
  totalAsset: number
  todayTradeAmount: number
  customerCount: number
  productCount: number
  pendingAuditCount: number
  pendingAlertCount: number
}

export interface IAssetTrend {
  date: string
  totalAsset: number
  tradeAmount: number
  customerCount: number
}

export interface ITradeCreateParams {
  customerId: number
  stockId: number
  tradeType: string
  tradePrice: number
  tradeQuantity: number
  remark?: string
}

export interface ICustomer {
  id: number
  customerName: string
  customerCode?: string
  phone?: string
  status?: string
}

export interface IHoldingDetail {
  id: number
  holdingId: number
  tradeId: number | null
  tradeNo?: string
  tradeType: string
  tradePrice: number
  tradeQuantity: number
  tradeAmount: number
  balanceQuantity: number
  costPriceAfter: number
  tradeAt: string
  createdAt: string
}

export enum TradeStatus {
  NORMAL = 'normal',
  HOLIDAY = 'holiday',
  SUSPENDED = 'suspended',
  DELISTED = 'delisted'
}

export enum BoardType {
  MAIN = 'main',
  SME = 'sme',
  CHINEXT = 'chinext',
  STAR = 'star',
  BSE = 'bse',
  HK_MAIN = 'hk_main',
  US_NASDAQ = 'us_nasdaq',
  US_NYSE = 'us_nyse'
}

export interface IStockQuoteExtended extends IStockQuote {
  stockId: number
  board: BoardType
  tradeStatus: TradeStatus
  bookValuePerShare: number
  lastSyncAt: string
  dataSource: string
  checkResult?: IDataCheckResult
}

export interface IStockHistoryItem {
  id: number
  stockId: number
  stockCode: string
  tradeDate: string
  openPrice: number
  closePrice: number
  highPrice: number
  lowPrice: number
  volume: number
  turnover: number
  changeRate: number
}

export interface IAuditTrailListResult {
  list: IQuoteAuditTrail[]
  stats: {
    operatorStats: Array<{ operatorId: number; operatorName: string; count: number }>
    operationTypeStats: Array<{ type: string; count: number }>
    periodStats: Array<{ period: string; count: number }>
    avgConsistencyScore: number
  }
}

export interface IConsistencyResult {
  score: number
  status: 'verified' | 'pending' | 'rejected'
  issues: Array<{ field: string; message: string; level: 'high' | 'medium' | 'low'; suggestion?: string }>
}

export interface IDataCheckResult {
  duplicateCheck: {
    passed: boolean
    duplicateCount: number
    details: string[]
  }
  timestampCheck: {
    passed: boolean
    isExpired: boolean
    expiredMinutes: number
    message: string
  }
  rangeCheck: {
    passed: boolean
    abnormalFields: string[]
    details: string[]
  }
}

export interface IQuoteValidationError {
  field: string
  value: any
  message: string
  code: string
  suggestion?: string
}

export interface IQuoteValidationResult {
  valid: boolean
  errors: IQuoteValidationError[]
  warnings: IQuoteValidationError[]
  accuracyLevel: 'high' | 'medium' | 'low'
}

export interface IQuoteImportResult {
  taskId: string
  summary: { total: number; success: number; failed: number; duplicates: number; errors: number; elapsedMs: number }
  successList: any[]
  errorList: Array<{ row: number; data: any; message: string; type: 'format' | 'duplicate' | 'logic' }>
  duplicateList: any[]
}

export interface IQuoteAuditTrail {
  id: number
  stockId: number
  stockCode: string
  operationType: string
  dataPeriod: string
  periodLabel?: string
  fieldChanges: Record<string, { before: any; after: any }>
  previousSnapshot?: any
  newSnapshot?: any
  operatorId: number
  operatorName: string
  sourceChannel: string
  dataSource: string
  remark?: string
  verificationStatus: string
  consistencyScore: number
  accuracyViolations?: any[]
  createdAt: string
}

export interface IImportProgress {
  taskId: string
  percent: number
  current: number
  total: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  message?: string
}

export interface IPeakValleyInfo {
  peakPrice: number
  peakDate: string
  valleyPrice: number
  valleyDate: string
  avgPrice: number
  maxChangeRate: number
  fromPeakChangeRate: number
  fromValleyChangeRate: number
  fromAvgChangeRate: number
  isDeepPullback: boolean
  isBigRebound: boolean
  historyStats: {
    avgPrice: number
    highestPrice: number
    lowestPrice: number
    maxChangeRate: number
  }
}

export interface ISyncHistoryItem {
  syncAt: string
  dataSource: string
  recordCount: number
  status: 'success' | 'failed'
}

export type IStockQuoteFull = IStockQuote & IStockQuoteExtended

export type DataSourceType = 'sina' | 'tencent' | 'eastmoney' | 'manual_input'

export type OperationType = 'create' | 'update' | 'import' | 'delete'

export interface IAuditOperator {
  id: number
  name: string
  avatar?: string
  role: string
}

export interface IAuditTrailItem {
  id: number
  stockId: number
  stockCode: string
  stockName: string
  operator: IAuditOperator
  operationType: OperationType
  dataSource: DataSourceType
  operatedAt: string
  beforeData: Partial<IStockQuote>
  afterData: Partial<IStockQuote>
  changedFields: string[]
  remark?: string
}

export interface IConsistencyIssue {
  field: string
  severity: 'high' | 'medium' | 'low'
  message: string
  suggestion: string
}

export interface IConsistencyCheckResult {
  score: number
  issues: IConsistencyIssue[]
  passed: boolean
}

export interface IPrecisionCheckResult {
  passed: boolean
  violations: Array<{
    field: string
    message: string
  }>
}

export interface IFieldComplianceResult {
  passed: boolean
  missingFields: string[]
  invalidFields: Array<{
    field: string
    message: string
  }>
  outOfRangeFields: Array<{
    field: string
    message: string
  }>
}

export interface ITimeValidityResult {
  passed: boolean
  tradeDateValid: boolean
  tradeDateMessage: string
  syncFreshness: boolean
  syncFreshnessMessage: string
  syncFrequencyValid: boolean
  syncFrequencyMessage: string
}

export interface IAuditTrailData {
  trail: IAuditTrailItem
  consistency: IConsistencyCheckResult
  precisionCheck: IPrecisionCheckResult
  fieldCompliance: IFieldComplianceResult
  timeValidity: ITimeValidityResult
  duplicateWarning: {
    exists: boolean
    duplicateStockCode: string
    duplicateTradeDate: string
  }
}

export type ThresholdType = 'change_rate' | 'volume' | 'turnover'

export type ScopeType = 'global' | 'sector'

export type ConfigStatus = 'permanent' | 'temporary' | 'expired'

export type ChangeType = 'create' | 'update' | 'delete' | 'expire'

export interface IQuoteThreshold {
  id: number
  thresholdType: ThresholdType
  thresholdTypeLabel?: string
  sector: string
  sectorLabel?: string
  scopeType: ScopeType
  scopeTypeLabel?: string
  configStatus: ConfigStatus
  configStatusLabel?: string
  minValue: number
  maxValue: number
  warningThreshold: number
  triggerThreshold: number
  operator: string
  version: number
  remark?: string
  effectiveStart: string
  effectiveEnd?: string
  createdBy: number
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface IThresholdValidationError {
  field: string
  message: string
  suggestion?: string
}

export interface IThresholdRangeCheckResult {
  valid: boolean
  errors: IThresholdValidationError[]
}

export interface IThresholdConflictInfo {
  type: 'logic' | 'extreme' | 'drift' | 'overlap'
  message: string
  level: 'high' | 'medium' | 'low'
  similarConfig?: Partial<IQuoteThreshold>
}

export interface IThresholdConflictCheckResult {
  hasConflict: boolean
  conflicts: IThresholdConflictInfo[]
}

export interface IThresholdPeriodCheckResult {
  valid: boolean
  message?: string
}

export interface IThresholdHistory {
  id: number
  thresholdId: number
  changeType: ChangeType
  changeTypeLabel?: string
  beforeSnapshot: Partial<IQuoteThreshold>
  afterSnapshot: Partial<IQuoteThreshold>
  conflictCheckResult?: IThresholdConflictCheckResult
  operatorId: number
  operatorName: string
  remark?: string
  createdAt: string
}

export interface IThresholdHistoryResult {
  list: IThresholdHistory[]
  stats: {
    changeTypeDist: Array<{ type: ChangeType; count: number }>
    operatorDist: Array<{ operatorId: number; operatorName: string; count: number }>
    avgInterval: number
  }
}

export interface IActiveThreshold {
  thresholdType: ThresholdType
  sector: string
  minValue: number
  maxValue: number
  warningThreshold: number
  triggerThreshold: number
  configStatus: ConfigStatus
  version: number
}

export interface IThresholdScenarioMatch {
  scenarioName: string
  matchScore: number
  suggestion: string
}

export interface IThresholdListParams {
  page: number
  pageSize: number
  scopeType?: ScopeType
  sector?: string
  thresholdType?: ThresholdType
  configStatus?: ConfigStatus
}

export interface IThresholdCreateData {
  thresholdType: ThresholdType
  sector: string
  scopeType: ScopeType
  configStatus: ConfigStatus
  minValue: number
  maxValue: number
  warningThreshold: number
  triggerThreshold: number
  remark?: string
  effectiveStart: string
  effectiveEnd?: string
}

export interface IThresholdUpdateData extends Partial<IThresholdCreateData> {
  version?: number
}

export interface IBatchUpdateThresholdsParams {
  ids: number[]
  patch: Partial<IThresholdUpdateData>
}

export type ReplayStatus = 'normal' | 'abnormal' | 'suspended'
export type ReplaySessionStatus = 'normal' | 'abnormal' | 'suspended'

export interface IPeriodSegment {
  label: string
  start: string
  end: string
  count: number
  avgChangeRate: number
}

export interface IHistoryRecord {
  id: number
  stockId: number
  stockCode: string
  stockName: string
  tradeDate: string
  openPrice: number
  closePrice: number
  highPrice: number
  lowPrice: number
  currentPrice: number
  changeAmount: number
  changeRate: number
  volume: number
  turnover: number
  replayStatus: ReplayStatus
}

export interface IReplaySession {
  id: number
  sessionName: string
  startDate: string
  endDate: string
  sector: string
  changeRateMin: number
  changeRateMax: number
  status: ReplaySessionStatus
  completenessScore: number
  conclusion: string
  createdBy: number
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface IReplayConclusion {
  id: number
  sessionId: number
  stockCode: string
  stockName: string
  sector: string
  periodLabel: string
  normalDays: number
  abnormalDays: number
  suspendedDays: number
  peakPrice: number
  valleyPrice: number
  avgChangeRate: number
  volatilityIndex: number
  comparisonScore: number
  conclusionText: string
  suggestion: string
  createdAt: string
}

export interface IVolatilityPattern {
  pattern: string
  similarity: number
  referencePeriod: string
  avgChangeRate: number
  volatilityIndex: number
  maxDrawdown: number
}

export interface IDataCompleteness {
  score: number
  missingDates: string[]
  isComplete: boolean
  totalTradingDays: number
  availableDays: number
}

export interface ISectorComparison {
  stockCode: string
  stockName: string
  avgChangeRate: number
  volatilityIndex: number
  rank: number
}

export interface IStockReplayQueryParams {
  stockCode?: string
  sector?: string
  startDate: string
  endDate: string
  changeRateMin?: number
  changeRateMax?: number
  page: number
  pageSize: number
}

export interface IReplayExportParams {
  stockCodes: string[]
  startDate: string
  endDate: string
  fields?: string[]
  orderBy?: string
  isFullExport?: boolean
  format?: 'csv' | 'xlsx'
}

export interface IReplaySessionDetail extends IReplaySession {
  conclusions: IReplayConclusion[]
  volatilityStats: IVolatilityPattern
}

import { RiskRuleType, RiskRuleStatus, EffectMode, CustomerLevel, RiskRuleChangeType, BatchOperationType } from '@/enums'

export interface IRiskRuleLevelParams {
  customerLevel: CustomerLevel
  customerLevelLabel?: string
  maxTradeAmount?: number
  minTradeAmount?: number
  dailyTradeLimit?: number
  maxPositionAmount?: number
  maxPositionRatio?: number
  singleStockPositionLimit?: number
  maxDailyVolatility?: number
  maxSingleVolatility?: number
  circuitBreakerThreshold?: number
  maxDailyTrades?: number
  maxTradesPerMinute?: number
  maxSameStockTrades?: number
  coolDownPeriod?: number
}

export interface IRiskRule {
  id: number
  ruleCode: string
  ruleName: string
  ruleType: RiskRuleType
  ruleTypeLabel?: string
  description?: string
  status: RiskRuleStatus
  statusLabel?: string
  effectMode: EffectMode
  effectModeLabel?: string
  customerLevels: CustomerLevel[]
  customerLevelLabels?: string[]
  levelParams: IRiskRuleLevelParams[]
  effectiveStart: string
  effectiveEnd?: string
  scheduledTime?: string
  priority: number
  version: number
  isGlobal?: boolean
  scopeSectors?: string[]
  createdBy: number
  createdByName?: string
  createdAt: string
  updatedAt: string
  updatedBy?: number
  updatedByName?: string
  remark?: string
}

export interface IRiskRuleValidationError {
  field: string
  message: string
  level: 'error' | 'warning'
  suggestion?: string
}

export interface IRiskRuleValidationResult {
  valid: boolean
  errors: IRiskRuleValidationError[]
  warnings: IRiskRuleValidationError[]
}

export interface IRiskRuleConflictInfo {
  conflictType: 'overlap' | 'logic' | 'range' | 'redundant'
  message: string
  level: 'high' | 'medium' | 'low'
  relatedRuleId?: number
  relatedRuleName?: string
}

export interface IRiskRuleCompatibilityCheck {
  compatible: boolean
  conflicts: IRiskRuleConflictInfo[]
  suggestions: string[]
}

export interface IRiskRuleHistory {
  id: number
  ruleId: number
  ruleName: string
  changeType: RiskRuleChangeType
  changeTypeLabel?: string
  beforeSnapshot: Partial<IRiskRule>
  afterSnapshot: Partial<IRiskRule>
  changedFields: string[]
  compatibilityCheck?: IRiskRuleCompatibilityCheck
  operatorId: number
  operatorName: string
  effectScope: string
  operationLogId?: number
  remark?: string
  createdAt: string
}

export interface IRiskRuleHistoryResult {
  list: IRiskRuleHistory[]
  total: number
  stats: {
    changeTypeDist: Array<{ type: RiskRuleChangeType; count: number }>
    operatorDist: Array<{ operatorId: number; operatorName: string; count: number }>
    conflictCount: number
  }
}

export interface IRiskRuleListParams {
  page: number
  pageSize: number
  ruleType?: RiskRuleType
  status?: RiskRuleStatus
  customerLevel?: CustomerLevel
  keyword?: string
  effectMode?: EffectMode
}

export interface IRiskRuleCreateData {
  ruleName: string
  ruleType: RiskRuleType
  description?: string
  effectMode: EffectMode
  customerLevels: CustomerLevel[]
  levelParams: IRiskRuleLevelParams[]
  effectiveStart: string
  effectiveEnd?: string
  scheduledTime?: string
  priority?: number
  isGlobal?: boolean
  scopeSectors?: string[]
  remark?: string
}

export interface IRiskRuleUpdateData extends Partial<IRiskRuleCreateData> {
  version?: number
}

export interface IBatchOperationResult {
  total: number
  success: number
  failed: number
  failedItems: Array<{ id: number; ruleName: string; reason: string }>
}

export interface IBatchOperationProgress {
  operationType: BatchOperationType
  operationTypeLabel?: string
  total: number
  current: number
  percent: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  successCount: number
  failedCount: number
  failedItems: Array<{ id: number; ruleName: string; reason: string }>
  startTime: string
  endTime?: string
}

export interface IRiskRuleScenarioMatch {
  scenarioName: string
  scenarioDescription: string
  matchScore: number
  volatilityRange: [number, number]
  suggestedRules: Array<{ ruleId: number; ruleName: string; ruleType: RiskRuleType }>
}

import {
  InterceptionType,
  InterceptionStatus,
  InterceptionLevel,
  InterceptionAction,
  AppealStatus,
} from '@/enums'

export interface ITradePreCheckParams {
  customerId: number
  stockCode?: string
  stockName?: string
  side: string
  price: number
  quantity: number
  orderType?: string
  tradeTime?: string
}

export interface ITriggeredRule {
  ruleId: number
  ruleCode: string
  ruleName: string
  ruleType: string
  thresholdValue?: number | string
  actualValue: number | string
  severity: 'info' | 'warning' | 'error'
  triggerReason: string
  ruleDescription?: string
}

export interface ITradePreCheckResult {
  allowTrade: boolean
  interceptionLevel: InterceptionLevel
  interceptionType?: InterceptionType
  triggeredRules: ITriggeredRule[]
  riskScore: number
  blockActions: InterceptionAction[]
  freezeFundAmount?: number
  freezePositionCodes?: string[]
  restrictions?: string[]
  warningMessage?: string
  estimatedWaitSeconds?: number
}

export interface IInterceptionRecord {
  id: number
  interceptionNo: string
  customerId: number
  customerName?: string
  customerAccount?: string
  customerLevel?: string
  interceptionType: InterceptionType
  interceptionTypeLabel?: string
  interceptionLevel: InterceptionLevel
  interceptionLevelLabel?: string
  status: InterceptionStatus
  statusLabel?: string
  stockCode?: string
  stockName?: string
  side?: string
  sideLabel?: string
  price?: number
  quantity?: number
  amount?: number
  triggeredRules: ITriggeredRule[]
  riskScore: number
  actions: InterceptionAction[]
  actionLabels?: string[]
  freezeFundAmount?: number
  freezePositionCodes?: string[]
  restrictionExpireTime?: string
  appealStatus: AppealStatus
  appealStatusLabel?: string
  appealId?: number
  handledBy?: number
  handledByName?: string
  handledAt?: string
  handlerRemark?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
  updatedAt?: string
  remark?: string
  relatedOrderNo?: string
  relatedTradeIds?: number[]
}

export interface IInterceptionListParams {
  page: number
  pageSize: number
  interceptionType?: InterceptionType
  status?: InterceptionStatus
  interceptionLevel?: InterceptionLevel
  customerId?: number
  customerAccount?: string
  stockCode?: string
  startDate?: string
  endDate?: string
  appealStatus?: AppealStatus
  keyword?: string
}

export interface IInterceptionStats {
  total: number
  byType: Array<{ type: InterceptionType; count: number; amount: number }>
  byLevel: Array<{ level: InterceptionLevel; count: number }>
  byStatus: Array<{ status: InterceptionStatus; count: number }>
  todayCount: number
  todayAmount: number
  frozenFundTotal: number
  pendingAppealCount: number
  pendingManualReviewCount: number
  trend: Array<{ date: string; count: number; amount: number }>
}

export interface IAppealCreateData {
  interceptionId: number
  reason: string
  description?: string
  attachmentUrls?: string[]
  contactInfo?: string
}

export interface IAppealRecord {
  id: number
  interceptionId: number
  customerId: number
  customerName?: string
  reason: string
  description?: string
  attachmentUrls?: string[]
  status: AppealStatus
  statusLabel?: string
  reviewerId?: number
  reviewerName?: string
  reviewedAt?: string
  reviewRemark?: string
  createdBy: number
  createdByName?: string
  createdAt: string
  updatedAt?: string
}

export interface IInterceptionHandleData {
  interceptionId: number
  targetStatus: InterceptionStatus
  action?: InterceptionAction[]
  releaseFundAmount?: number
  releasePositionCodes?: string[]
  remark: string
  sendAlert?: boolean
  notifyCustomer?: boolean
}

export interface IAccountRiskStatus {
  customerId: number
  riskLevel: 'normal' | 'watch' | 'warning' | 'critical'
  isRestricted: boolean
  restrictions: string[]
  frozenFunds: number
  frozenPositions: Array<{ stockCode: string; stockName: string; quantity: number; amount: number }>
  activeInterceptionCount: number
  lastRiskScanTime: string
  triggers: Array<{ type: string; message: string; level: string }>
}

export interface IAlertMessage {
  id: number
  alertType: string
  title: string
  content: string
  level: InterceptionLevel
  relatedId?: number
  relatedType?: string
  targetUserIds?: number[]
  isRead: boolean
  createdAt: string
}

import {
  CustomerRiskLevel,
  RiskLevelChangeType,
  ReviewPriority,
  AssessmentDataSource,
  BatchLevelUpdateMode,
  DataIntegrityStatus,
} from '@/enums'

export interface IRiskLevelStrategyConfig {
  tradeLimit: {
    singleTradeMax: number
    dailyTotalMax: number
  }
  positionLimit: {
    singleStockRatio: number
    totalPositionRatio: number
    totalAmountMax?: number
  }
  reviewPriority: ReviewPriority
  volatilityTolerance: number
  frequencyControl: {
    maxDailyTrades: number
    maxTradesPerHour: number
  }
  specialRestrictions: string[]
  allowedMarkets: string[]
  blockedStocks?: string[]
  marginEnabled: boolean
  optionsEnabled: boolean
}

export interface IDataIntegrityCheck {
  source: AssessmentDataSource
  status: DataIntegrityStatus
  completeness: number
  lastUpdated: string
  missingFields: string[]
}

export interface ICustomerRiskProfile {
  id: number
  customerId: number
  customerName: string
  customerAccount: string
  customerLevel: string
  riskLevel: CustomerRiskLevel
  riskLevelLabel?: string
  riskScore: number
  assessmentDate: string
  nextAssessmentDate: string
  validUntil?: string
  dataIntegrity: IDataIntegrityCheck[]
  overallIntegrity: number
  canBeAssessed: boolean
  assessmentBlockers: string[]
  strategyConfig: IRiskLevelStrategyConfig
  reviewPriority: ReviewPriority
  tradeStats: {
    totalTrades30d: number
    totalAmount30d: number
    avgTradeAmount: number
    maxDailyTrades: number
    interceptionCount30d: number
    abnormalRatio: number
  }
  assetStats: {
    totalAssets: number
    netAssets: number
    availableCash: number
    positionAmount: number
    positionRatio: number
    totalMargin: number
    marginRatio: number
    assetChange30d: number
    assetChange30dRatio: number
  }
  behaviorScores: {
    tradeFrequencyScore: number
    volatilityScore: number
    concentrationScore: number
    interceptionScore: number
    marketAdaptabilityScore: number
    overallScore: number
  }
  createdAt: string
  updatedAt: string
  assessedBy?: number
  assessedByName?: string
}

export interface ICustomerRiskListParams {
  page: number
  pageSize: number
  riskLevel?: CustomerRiskLevel
  keyword?: string
  customerLevel?: string
  minRiskScore?: number
  maxRiskScore?: number
  canBeAssessed?: boolean
  reviewPriority?: ReviewPriority
  startDate?: string
  endDate?: string
  interceptionCountRange?: [number, number]
}

export interface IRiskLevelChangeRecord {
  id: number
  customerId: number
  customerName?: string
  customerAccount?: string
  changeType: RiskLevelChangeType
  changeTypeLabel?: string
  fromLevel: CustomerRiskLevel | null
  fromLevelLabel?: string
  toLevel: CustomerRiskLevel
  toLevelLabel?: string
  fromScore: number
  toScore: number
  changedAt: string
  changeReason: string
  supportingData: {
    dataSources: AssessmentDataSource[]
    dataIntegrity: number
    keyMetrics: Record<string, number>
    triggeredRules?: string[]
  }
  ruleComplianceCheck: {
    valid: boolean
    complianceScore: number
    violations: Array<{ rule: string; severity: string; suggestion?: string }>
  }
  impactAnalysis: {
    affectedStrategyFields: string[]
    estimatedLimitChange: string
    estimatedReviewChange: string
  }
  operatorId: number
  operatorName?: string
  operationType: 'auto' | 'manual' | 'batch'
  batchOperationId?: number
  remark?: string
}

export interface IRiskLevelHistoryParams {
  page: number
  pageSize: number
  customerId?: number
  changeType?: RiskLevelChangeType
  fromLevel?: CustomerRiskLevel
  toLevel?: CustomerRiskLevel
  startDate?: string
  endDate?: string
}

export interface IRiskLevelStats {
  levelDistribution: Array<{
    level: CustomerRiskLevel
    count: number
    ratio: number
    avgScore: number
    totalAssets: number
    abnormalRatio: number
  }>
  levelChanges: Array<{
    date: string
    upgrades: number
    downgrades: number
    initial: number
  }>
  dataIntegrityStats: {
    complete: number
    partial: number
    missing: number
  }
  reviewDistribution: Array<{
    priority: ReviewPriority
    count: number
    avgWaitTime: number
  }>
  riskIncidence: Record<CustomerRiskLevel, {
    totalTrades: number
    interceptions: number
    incidenceRate: number
    lossRate: number
  }>
  assessmentCompletion: {
    overdueCount: number
    expiringCount: number
    completedCount: number
    pendingCount: number
  }
  metrics: {
    totalCustomers: number
    assessedCustomers: number
    avgRiskScore: number
    medianRiskScore: number
  }
}

export interface IRiskLevelUpdateData {
  customerId: number
  targetLevel: CustomerRiskLevel
  targetScore?: number
  changeReason: string
  supportingEvidence?: string
  autoSyncStrategy?: boolean
  sendNotification?: boolean
  effectiveImmediately?: boolean
  scheduledTime?: string
}

export interface IBatchLevelUpdateParams {
  mode: BatchLevelUpdateMode
  targetLevel: CustomerRiskLevel
  customerIds?: number[]
  sourceLevel?: CustomerRiskLevel
  interceptionThreshold?: {
    minCount30d: number
    minAbnormalRatio: number
  }
  assessmentResultFilter?: {
    minScore?: number
    maxScore?: number
    passedOnly?: boolean
  }
  changeReason: string
  operatorRemark?: string
  autoSyncStrategies?: boolean
  dryRun?: boolean
}

export interface IBatchLevelUpdatePreview {
  totalAffected: number
  byLevel: Record<CustomerRiskLevel, number>
  byCurrentLevel: Record<CustomerRiskLevel, number>
  sampleCustomers: Array<{
    id: number
    name: string
    currentLevel: CustomerRiskLevel
    targetLevel: CustomerRiskLevel
    currentScore: number
  }>
  estimatedImpacts: {
    strategySyncCount: number
    priorityChangeCount: number
    notifiedCustomerCount: number
  }
  validationErrors: Array<{ customerId: number; reason: string }>
}

export interface IBatchLevelUpdateResult {
  success: boolean
  total: number
  processed: number
  successful: number
  failed: number
  failedItems: Array<{ customerId: number; customerName: string; reason: string }>
  batchOperationId: number
  previewEstimatedImpact?: string
}

export interface IRiskAssessmentCreateData {
  customerIds: number[]
  assessmentType: 'standard' | 'simplified' | 'comprehensive'
  dataSources: AssessmentDataSource[]
  autoApplyLevel?: boolean
  notifyCustomer?: boolean
  expirationDays?: number
  operatorRemark?: string
}

export interface IRiskAssessmentResult {
  total: number
  completed: number
  withLevelChanges: number
  failed: number
  assessmentIds: number[]
  changedCustomers: Array<{
    customerId: number
    fromLevel: CustomerRiskLevel
    toLevel: CustomerRiskLevel
    fromScore: number
    toScore: number
  }>
}

export interface ILevelStandardOptimizationSuggestion {
  id: number
  metricName: string
  currentThreshold: number | string
  suggestedThreshold: number | string
  rationale: string
  impactAnalysis: string
  historicalEvidence: {
    metricChange: string
    incidenceChange: string
  }
  priority: 'high' | 'medium' | 'low'
}

export interface IRiskLevelStandard {
  level: CustomerRiskLevel
  scoreRange: [number, number]
  criteria: Array<{
    metric: string
    operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq' | 'between'
    threshold: number | [number, number]
    weight: number
  }>
  optimizationSuggestions: ILevelStandardOptimizationSuggestion[]
  updatedAt: string
}

import {
  ReplayAnalysisDimension,
  InterceptionEffectiveness,
  ReplayExportFormat,
  HandleChannel,
  RuleValidityStatus,
  VulnerabilitySeverity,
  ReplayTimeRange,
  AnomalyRecurrenceStatus,
  RuleOptimizationCategory,
} from '@/enums'

export interface IReplayFilterNode {
  id: string
  dimension: ReplayAnalysisDimension
  operator: 'in' | 'not_in' | 'between' | 'eq' | 'gt' | 'gte' | 'lt' | 'lte'
  values: any[]
  children?: IReplayFilterNode[]
  logic?: 'AND' | 'OR'
}

export interface IReplayFilterGroup {
  id: string
  title: string
  logic: 'AND' | 'OR'
  children: Array<IReplayFilterNode | IReplayFilterGroup>
  depth: number
}

export interface IReplayQueryParams {
  page?: number
  pageSize?: number
  timeRange: ReplayTimeRange
  customStart?: string
  customEnd?: string
  exceptionTypes?: InterceptionType[]
  riskLevels?: CustomerRiskLevel[]
  interceptionEffects?: InterceptionEffectiveness[]
  ruleCategories?: RiskRuleType[]
  customerLevels?: string[]
  handleOutcomes?: string[]
  reviewChannels?: HandleChannel[]
  minInvolvedAmount?: number
  maxInvolvedAmount?: number
  recurrenceStatus?: AnomalyRecurrenceStatus[]
  filterGroup?: IReplayFilterGroup
  includeReplayValidation?: boolean
  onlyHighImpact?: boolean
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export interface IReplayFilterValidation {
  valid: boolean
  totalFilters: number
  nestedDepth: number
  warnings: Array<{ code: string; message: string; severity: 'info' | 'warning' | 'error' }>
  timeSpanDays: number
  estimatedRecords: number
  estimatedResponseMs: number
  complianceFlags: Array<{ flag: string; passed: boolean; suggestion?: string }>
}

export interface IReplayCoreMetrics {
  totalEvents: number
  screenedEvents: number
  totalInterceptions: number
  validInterceptions: number
  validRiskEvents: number
  recurrenceCount: number
  resolvedEvents: number
  manuallyReviewedEvents: number
  complianceReviewed: number
  compliancePassed: number
  interceptionRate: number
  recurrenceRate: number
  resolutionRate: number
  avgHandleTime: number
  medianHandleTime: number
  compliancePassRate: number
  ruleEffectiveness: number
  falsePositiveRate: number
  falseNegativeRate: number
  totalEffectiveness: number
}

export interface IReplayTrendPoint {
  date: string
  totalEvents: number
  interceptions: number
  validInterceptions: number
  recurrences: number
  resolved: number
  manuallyHandled: number
  avgHandleTime: number
  complianceRate: number
}

export interface IReplayEvent {
  id: number
  eventId: string
  customerId: number
  customerName: string
  customerAccount: string
  customerLevel: string
  customerRiskLevel: CustomerRiskLevel
  occurredAt: string
  occurredIp?: string
  occurredBranch?: string
  exceptionType: InterceptionType
  exceptionTypeLabel: string
  interceptionLevel: InterceptionLevel
  severity: 'low' | 'medium' | 'high' | 'critical'
  triggeredRuleId: number
  triggeredRuleName: string
  triggeredRuleType: string
  interceptionEffect: InterceptionEffectiveness
  recurrenceStatus: AnomalyRecurrenceStatus
  recurrenceCount: number
  recurrenceFirstAt?: string
  involvedAmount: number
  involvedStocks?: Array<{ code: string; name: string; quantity: number; amount: number }>
  freezeAmount?: number
  frozenDays?: number
  handleChannel: HandleChannel
  handleOutcome: string
  handledById?: number
  handledByName?: string
  handledAt?: string
  appealSubmitted: boolean
  appealSucceeded?: boolean
  slaBreached: boolean
  dataIntegrity: number
  missingFields?: string[]
  replayValidated: boolean
  replayIssues: Array<{ type: string; description: string; severity: string }>
  processingChainIds: string[]
  createdAt: string
  updatedAt: string
}

export interface IReplayProcessingNode {
  chainId: string
  nodeType: 'trigger' | 'precheck' | 'intercept' | 'first_review' | 'second_review' | 'compliance' | 'appeal' | 'close'
  nodeTitle: string
  handledBy: string
  handledAt: string
  handleDurationMs: number
  actionsTaken: string[]
  comments?: string
  referenceDocs?: Array<{ id: string; name: string; type: string }>
  validations: Array<{ rule: string; passed: boolean; details?: string }>
  slaCompliant: boolean
  previousNodeId?: string
  nextNodeId?: string
}

export interface IReplayProcessingChain {
  chainId: string
  startedAt: string
  closedAt?: string
  totalDurationMs: number
  slaBreached: boolean
  totalNodes: number
  completedNodes: number
  nodes: IReplayProcessingNode[]
  complianceChecks: Array<{ rule: string; passed: boolean; severity: 'low' | 'medium' | 'high' | 'critical' }>
  duplicateWithChains: string[]
}

export interface IRuleValidityAnalysis {
  ruleId: number
  ruleName: string
  ruleType: string
  validityStatus: RuleValidityStatus
  triggerCount: number
  validTriggerCount: number
  invalidTriggerCount: number
  overTriggeredCount: number
  effectiveness: number
  avgResponseTimeMs: number
  falsePositiveRate: number
  falseNegativeRate: number
  optimizedSuggestions: Array<{
    category: RuleOptimizationCategory
    description: string
    estimatedImprovement: number
    impactScope: string
  }>
  triggeredEventDistribution: Record<string, number>
}

export interface IRiskVulnerability {
  id: string
  code: string
  title: string
  description: string
  severity: VulnerabilitySeverity
  affectedScope: string
  affectedEventsCount: number
  estimatedFinancialImpact: number
  detectionDate: string
  reportedBy: string
  rootCauseAnalysis: string
  reproductionSteps?: string[]
  evidenceChains: Array<{ eventId: string; occurredAt: string; description: string }>
  exploitDifficulty: 'low' | 'medium' | 'high'
  priorityScore: number
  remediationMeasures: Array<{
    type: string
    description: string
    responsibleTeam: string
    deadline?: string
  }>
  mitigationTimeline: {
    identifiedAt: string
    triageAt?: string
    remediationStarted?: string
    fixedAt?: string
    verifiedAt?: string
  }
  relatedRuleIds: number[]
  optimizationSuggestions: IReplayOptimizationSuggestion[]
  dataQualityIssues: Array<{ field: string; issue: string; affectedRecords: number }>
}

export interface IReplayOptimizationSuggestion {
  id: string
  category: RuleOptimizationCategory
  targetRuleId?: number
  currentSetting: string
  suggestedSetting: string
  rationale: string
  expectedBenefits: {
    interceptionImprovement?: number
    falsePositiveReduction?: number
    recurrenceReduction?: number
    avgHandleTimeReduction?: number
  }
  historicalBacktest: {
    period: string
    totalEvents: number
    estimatedChanges: number
    riskDelta: number
  }
  implementationComplexity: 'low' | 'medium' | 'high'
  priority: 'immediate' | 'short_term' | 'long_term' | 'no_priority'
  references: string[]
}

export interface IReplayExportConfig {
  format: ReplayExportFormat
  fields: string[]
  sortField: string
  sortOrder: 'asc' | 'desc'
  includeMeta: boolean
  includeAggregatedSummary: boolean
  splitBy: 'none' | 'exception_type' | 'risk_level' | 'handle_channel'
  splitSize: number
  fileName: string
  watermark: string
  compression: boolean
}

export interface IReplayExportProgress {
  taskId: string
  status: 'queued' | 'preparing' | 'exporting' | 'validating' | 'packaging' | 'completed' | 'failed' | 'cancelled'
  totalRecords: number
  processedRecords: number
  validatedRecords: number
  dataIntegrity: number
  missingRecordCount: number
  missingRecordsDetails: Array<{ eventId: string; reason: string }>
  percent: number
  currentPhase: string
  estimatedRemaining: number
  startedAt: string
  updatedAt?: string
  fileSizeBytes?: number
  fileCount?: number
  sha256Hash?: string
  downloadUrl?: string
}

export interface IReplayDimensionStat {
  dimension: ReplayAnalysisDimension
  dimensionLabel: string
  segments: Array<{
    key: string
    label: string
    color: string
    eventCount: number
    ratio: number
    interceptionRate: number
    recurrenceRate: number
    resolutionRate: number
    avgHandleTime: number
  }>
}

export interface IReplayDashboard {
  coreMetrics: IReplayCoreMetrics
  trendData: IReplayTrendPoint[]
  dimensionStats: IReplayDimensionStat[]
  eventSamples: IReplayEvent[]
  ruleValidity: IRuleValidityAnalysis[]
  vulnerabilities: IRiskVulnerability[]
  optimizationSuggestions: IReplayOptimizationSuggestion[]
  generatedAt: string
  querySignature: string
  recordCount: number
}

import {
  TradeComplianceStatus,
  TradeReviewType,
  TradeRiskCategory,
  ViolationType,
  AuditLogAction,
} from '@/enums'

export interface ITradeComplianceAudit {
  id: number
  auditNo: string
  tradeId: number
  tradeNo: string
  customerId: number
  customerName: string
  stockCode: string
  stockName: string
  tradeType: string
  tradeAmount: number
  tradeQuantity: number
  tradePrice: number
  complianceStatus: TradeComplianceStatus
  complianceStatusLabel?: string
  reviewType: TradeReviewType
  reviewTypeLabel?: string
  riskCategory: TradeRiskCategory
  riskCategoryLabel?: string
  riskScore: number
  violationTypes: ViolationType[]
  violationTypeLabels?: string[]
  violationReasons: string[]
  reviewerId: number | null
  reviewerName: string | null
  reviewOpinion: string
  reviewAt: string | null
  timeoutFlag: boolean
  timeoutRemindedAt: string | null
  orderStatus: string
  complianceDeadline: string
  archiveId: number | null
  syncedToTrade: boolean
  syncedToCustomer: boolean
  createdAt: string
  updatedAt: string
}

export interface ITradeCompliancePreCheckResult {
  canReview: boolean
  permissionValid: boolean
  orderStatusValid: boolean
  timelinessValid: boolean
  autoReviewable: boolean
  requireManualReview: boolean
  duplicateReviewBlocked: boolean
  duplicateReason?: string
  timeoutMinutes?: number
  timeRemainingMinutes?: number
  messages: string[]
  warnings: string[]
}

export interface ITradeComplianceAuditLog {
  id: number
  auditId: number
  auditNo: string
  action: AuditLogAction
  actionLabel?: string
  operatorId: number
  operatorName: string
  detail: Record<string, any>
  consistencyCheck?: ITradeConsistencyCheckResult
  violationIntercepted?: boolean
  violationMessage?: string
  createdAt: string
}

export interface ITradeConsistencyCheckResult {
  passed: boolean
  score: number
  issues: Array<{
    field: string
    rule: string
    message: string
    severity: 'high' | 'medium' | 'low'
    suggestion?: string
  }>
  complianceRuleVersion: string
  checkedAt: string
}

export interface ITradeComplianceBatchParams {
  ids: number[]
  auditStatus: 'approved' | 'rejected'
  reviewOpinion: string
  violationTypes?: ViolationType[]
  violationReasons?: string[]
}

export interface ITradeComplianceBatchPreview {
  totalSelected: number
  byAmount: { range: string; count: number }
  byTradeType: Record<string, number>
  byRiskCategory: Record<TradeRiskCategory, number>
  canBatchApprove: number
  canBatchReject: number
  blockedItems: Array<{ id: number; tradeNo: string; reason: string }>
}

export interface ITradeComplianceListParams {
  page: number
  pageSize: number
  complianceStatus?: TradeComplianceStatus
  riskCategory?: TradeRiskCategory
  reviewType?: TradeReviewType
  tradeType?: string
  keyword?: string
  timeoutOnly?: boolean
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  violationType?: ViolationType
}

export interface ITradeComplianceStats {
  totalPending: number
  totalAutoApproved: number
  totalManualPending: number
  totalApproved: number
  totalRejected: number
  totalReturned: number
  timeoutCount: number
  avgReviewMinutes: number
  complianceRate: number
  byRiskCategory: Record<TradeRiskCategory, number>
  byViolationType: Record<ViolationType, number>
}

import {
  QualificationStatus,
  QualificationReviewType,
  QualificationLevel,
  QualificationDocumentType,
  QualificationIssueType,
  QualificationLogAction,
} from '@/enums'

export interface IQualificationDocument {
  type: QualificationDocumentType
  name: string
  fileUrl: string
  uploader?: string
  uploadedAt: string
  expiryDate?: string
  verified: boolean
  authenticityVerified: boolean
}

export interface ICustomerQualification {
  id: number
  qualificationNo: string
  customerId: number
  customerName: string
  customerType: string
  qualificationStatus: QualificationStatus
  reviewType: QualificationReviewType
  qualificationLevel: QualificationLevel
  documents: IQualificationDocument[]
  missingDocuments: QualificationDocumentType[]
  expiredDocuments: QualificationDocumentType[]
  fakeSuspiciousDocuments: QualificationDocumentType[]
  issueTypes: QualificationIssueType[]
  issueReasons: string[]
  reviewerId?: number
  reviewerName?: string
  reviewOpinion?: string
  reviewAt?: string
  effectiveDate: string
  expiryDate: string
  expireWarningSent: boolean
  expireWarningAt?: string
  permissions: string[]
  tradingAllowed: boolean
  customerProfileSynced: boolean
  authenticityCheckPassed: boolean
  regulatoryComplianceScore: number
  lastRecheckAt?: string
  recheckCount: number
  createdAt: string
  updatedAt: string
}

export interface ICustomerQualificationPreCheckResult {
  canReview: boolean
  permissionValid: boolean
  documentsComplete: boolean
  documentsValid: boolean
  documentsAuthentic: boolean
  expiredDocuments: QualificationDocumentType[]
  missingDocuments: QualificationDocumentType[]
  fakeSuspiciousDocuments: QualificationDocumentType[]
  blocked: boolean
  messages: string[]
  warnings: string[]
  documentIntegrityScore: number
}

export interface ICustomerQualificationLog {
  id: number
  qualificationId: number
  qualificationNo: string
  action: QualificationLogAction
  operatorId?: number
  operatorName: string
  detail: Record<string, any>
  authenticityCheck?: {
    passed: boolean
    score: number
    issues: Array<{
      document: QualificationDocumentType
      rule: string
      message: string
      severity: string
      suggestion: string
    }>
  }
  fakeIntercepted: boolean
  interceptMessage?: string
  createdAt: string
}

export interface IAuthenticityCheckResult {
  passed: boolean
  overallScore: number
  documentResults: Record<QualificationDocumentType, {
    passed: boolean
    score: number
    verified: boolean
    issues: string[]
  }>
  regulatoryMatch: {
    dimension: string
    compliant: boolean
    detail: string
  }[]
}

export interface IQualificationBatchParams {
  ids: number[]
  action: 'approve' | 'reject' | 'initiate_recheck'
  qualificationLevel?: QualificationLevel
  rejectReasons?: string[]
  issueTypes?: QualificationIssueType[]
  reviewOpinion?: string
}

export interface IQualificationBatchPreview {
  byCustomerType: Record<string, number>
  byQualificationLevel: Record<QualificationLevel, number>
  byRegistrationYear: Record<string, number>
  blockReasons: Array<{
    id: number
    qualificationNo: string
    customerName: string
    reason: string
  }>
  simpleApprovableCount: number
  totalCount: number
}

export interface IQualificationListParams {
  page?: number
  pageSize?: number
  qualificationNo?: string
  customerName?: string
  customerType?: string
  qualificationStatus?: QualificationStatus
  reviewType?: QualificationReviewType
  qualificationLevel?: QualificationLevel
  expireWarningSent?: boolean
  expiryDateFrom?: string
  expiryDateTo?: string
  tradingAllowed?: boolean
}

export interface IQualificationStats {
  totalPending: number
  totalApproved: number
  totalRejected: number
  totalExpired: number
  totalExpireSoon: number
  totalRevoked: number
  avgComplianceScore: number
  authenticityPassRate: number
  byCustomerType: Record<string, number>
  byQualificationLevel: Record<QualificationLevel, number>
  byIssueType: Record<QualificationIssueType, number>
}

