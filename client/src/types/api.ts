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

export interface IStockProduct {
  id: number
  productCode: string
  stockCode: string
  stockName: string
  productType: string
  market: string
  sector: string
  board: string
  productStatus: string
  archiveStatus: string
  filingStatus: string
  exchangeCode: string
  listingDate: string
  delistingDate?: string
  suspendDate?: string
  resumeDate?: string
  faceValue: number
  totalShares: number
  circulatingShares: number
  tradingRule: string
  feeStandard: string
  settlementRule: string
  minTradeUnit: number
  priceLimit: number
  tickSize: number
  filingNo: string
  filingDate?: string
  filingInstitution: string
  remark?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
  updatedBy?: number
  updatedByName?: string
  updatedAt?: string
}

export interface IStockProductValidation {
  valid: boolean
  codeValid: boolean
  codeMessage: string
  filingValid: boolean
  filingMessage: string
  infoComplete: boolean
  missingFields: string[]
  duplicateCode: boolean
}

export interface IStockProductArchiveResult {
  productCode: string
  success: boolean
  message: string
}

export interface IStockProductBatchImportResult {
  total: number
  success: number
  failed: number
  duplicate: number
  successList: IStockProduct[]
  errorList: Array<{ row: number; data: any; errors: IValidationError[]; type: string }>
  duplicateList: any[]
}

export interface IStockProductAuditTrailData {
  sourceInfo: {
    createdBy: string
    createdAt: string
    updatedBy: string
    updatedAt: string
    filingNo: string
    filingDate: string
    filingInstitution: string
    filingCredential?: string
    originalData?: Partial<IStockProduct>
  }
  operationLogs: Array<{
    id: number
    operation: string
    operationType: string
    username: string
    remark: string
    ipAddress: string
    createdAt: string
  }>
  consistencyCheck: {
    passed: boolean
    issues: Array<{ type: string; severity: string; message: string }>
  }
  filingVerification: {
    codeMatch: boolean
    nameMatch: boolean
    statusMatch: boolean
    paramsValid: boolean
    details: Array<{ field: string; expected: string; actual: string; passed: boolean }>
  }
}

export interface IStockClassification {
  id: number
  classCode: string
  className: string
  classLevel: string
  parentId: number | null
  parentName?: string
  classStatus: string
  sortOrder: number
  productCount: number
  riskTag?: string
  marketCapRange?: string
  industryCode?: string
  description?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
  updatedBy?: number
  updatedByName?: string
  updatedAt?: string
}

export interface IStockClassValidation {
  valid: boolean
  permissionValid: boolean
  permissionMessage: string
  levelValid: boolean
  levelMessage: string
  nameUnique: boolean
  nameMessage: string
  levelExceeded: boolean
}

export interface IStockClassDeleteCheck {
  canDelete: boolean
  relatedProductCount: number
  relatedProducts: Array<{ id: number; stockCode: string; stockName: string }>
  message: string
}

export interface IStockClassBatchResult {
  total: number
  success: number
  failed: number
  successList: IStockClassification[]
  errorList: Array<{ row: number; data: any; errors: IValidationError[]; type: string }>
}

export interface IStockClassTraceData {
  sourceInfo: {
    createdBy: string
    createdAt: string
    updatedBy: string
    updatedAt: string
    classCode: string
    className: string
    originalData?: Partial<IStockClassification>
  }
  operationLogs: Array<{
    id: number
    operation: string
    operationType: string
    username: string
    remark: string
    ipAddress: string
    createdAt: string
  }>
  levelCheck: {
    passed: boolean
    issues: Array<{ type: string; severity: string; message: string }>
  }
  classificationCheck: {
    accuracyValid: boolean
    duplicateFound: boolean
    invalidFound: boolean
    details: Array<{ field: string; expected: string; actual: string; passed: boolean }>
  }
}

export interface IStockFeeRate {
  id: number
  feeCode: string
  feeName: string
  feeRateType: string
  feeRateValue: number
  feeRateUnit: string
  minFee?: number
  maxFee?: number
  customerLevel: string
  tradeScene: string
  productType?: string
  productCodes?: string[]
  scopeType: string
  feeRateStatus: string
  effectiveStartTime: string
  effectiveEndTime?: string
  conflictLevel: string
  description?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
  updatedBy?: number
  updatedByName?: string
  updatedAt?: string
}

export interface IStockFeeRateValidation {
  valid: boolean
  permissionValid: boolean
  permissionMessage: string
  rangeValid: boolean
  rangeMessage: string
  productScopeValid: boolean
  productScopeMessage: string
  rateExceeded: boolean
  conflictFound: boolean
  conflictDetails: Array<{ existingFeeId: number; existingFeeName: string; conflictType: string }>
}

export interface IStockFeeRateConflict {
  id: number
  newFeeId: number
  existingFeeId: number
  conflictType: string
  conflictLevel: string
  description: string
  resolved: boolean
}

export interface IStockFeeRateBatchResult {
  total: number
  success: number
  failed: number
  affectedProducts: number
  successList: IStockFeeRate[]
  errorList: Array<{ row: number; data: any; errors: IValidationError[]; type: string }>
}

export interface IStockFeeRateTraceData {
  sourceInfo: {
    createdBy: string
    createdAt: string
    updatedBy: string
    updatedAt: string
    feeCode: string
    feeName: string
    originalData?: Partial<IStockFeeRate>
  }
  versionHistory: Array<{
    version: number
    feeRateValue: number
    effectiveStartTime: string
    effectiveEndTime?: string
    operator: string
    operationTime: string
    remark: string
  }>
  effectivePeriods: Array<{
    startTime: string
    endTime?: string
    status: string
    rateValue: number
  }>
  complianceCheck: {
    passed: boolean
    industryStandardMatch: boolean
    issues: Array<{ type: string; severity: string; message: string; standardValue?: number; actualValue: number }>
  }
  calculationVerification: {
    sampleTrades: Array<{
      tradeId: number
      tradeAmount: number
      expectedFee: number
      actualFee: number
      passed: boolean
    }>
    overallAccuracy: number
  }
}

export interface IStockFeeCalculationDetail {
  tradeAmount: number
  feeRateValue: number
  feeRateType: string
  baseFee: number
  minFee?: number
  maxFee?: number
  finalFee: number
  breakdown: Array<{ item: string; amount: number }>
}

export interface IStockStatusSyncRecord {
  id: number
  syncCode: string
  stockCode: string
  stockName: string
  fromStatus: string
  toStatus: string
  changeType: string
  syncSource: string
  announcementId: string
  announcementTitle?: string
  announcementPublishTime?: string
  effectiveTime: string
  riskLevel: string
  auditStatus: string
  auditRemark?: string
  tradingLocked: boolean
  holdingCleared: boolean
  pushedToClient: boolean
  affectedHoldings: number
  affectedOrders: number
  operatorId?: number
  operatorName?: string
  operationTime: string
  remark?: string
  createdAt: string
}

export interface IStockStatusAnnouncement {
  id: number
  announcementId: string
  announcementCode: string
  announcementTitle: string
  exchange: string
  stockCode: string
  stockName: string
  publishTime: string
  effectiveTime: string
  targetStatus: string
  announcementType: string
  synced: boolean
  syncTime?: string
  content?: string
  url?: string
}

export interface IStockStatusValidateResult {
  valid: boolean
  permissionValid: boolean
  permissionMessage: string
  currentStatusValid: boolean
  currentStatusMessage: string
  announcementExist: boolean
  announcementMessage: string
  announcementMatched: boolean
  announcementDetail?: IStockStatusAnnouncement
  canChange: boolean
  blockReason: string
  allowedTransitions: string[]
}

export interface IStockStatusLockResult {
  stockCode: string
  stockName: string
  previousStatus: string
  newStatus: string
  tradingLocked: boolean
  holdingCleared: boolean
  lockedAccounts: number
  pendingOrdersCancelled: number
  positionsLiquidated: number
  clientNotificationsSent: number
  affectedCustomerCount: number
  syncStatus: 'success' | 'partial' | 'failed'
  syncMessage: string
}

export interface IStockStatusBatchResult {
  total: number
  validated: number
  success: number
  failed: number
  skipped: number
  successList: IStockStatusSyncRecord[]
  errorList: Array<{
    stockCode: string
    stockName: string
    errorCode: string
    errorMessage: string
    announcementMissing: boolean
  }>
  skippedList: Array<{
    stockCode: string
    stockName: string
    reason: string
    currentStatus: string
  }>
  dataLockReleased: boolean
  listRefreshPartial: boolean
}

export interface IStockStatusTraceData {
  sourceInfo: {
    firstListingDate: string
    initialStatus: string
    totalChangeCount: number
    listingExchange: string
  }
  lifecycleRecords: Array<{
    sequence: number
    fromStatus: string
    toStatus: string
    changeType: string
    syncSource: string
    effectiveTime: string
    operator: string
    durationDays: number
  }>
  complianceCheck: {
    passed: boolean
    timelinessPassed: boolean
    accuracyPassed: boolean
    regulatoryPassed: boolean
    totalScore: number
    issues: Array<{
      checkItem: string
      severity: string
      description: string
      expectedTime?: string
      actualTime?: string
      delayHours?: number
    }>
  }
  marketComparison: {
    marketStatus: string
    platformStatus: string
    consistent: boolean
    timeDiffSeconds: number
    lastSyncExchangeTime: string
    lastSyncPlatformTime: string
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
  customerRiskLevel?: string
  customerStatus?: string
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
  lockStatus?: string
  lockReason?: string
  lockedBy?: number
  lockedByName?: string
  lockedAt?: string
  unlockedBy?: number
  unlockedByName?: string
  unlockedAt?: string
  lastAdjustBy?: number
  lastAdjustByName?: string
  lastAdjustAt?: string
  firstBuyDate: string
  lastTradeDate: string | null
  createdAt?: string
  updatedAt?: string
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

export interface IReplayQueryParams {
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
