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

export interface ICustomerAsset {
  id: number
  customerName: string
  idCard: string
  phone: string
  totalAsset: number
  availableAmount: number
  frozenAmount: number
  totalProfit: number
  totalCost: number
  riskLevel: string
  customerType: string
  status: string
  createdAt: string
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
