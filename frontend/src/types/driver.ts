export interface QualificationCheck {
  type: string
  name: string
  passed: boolean
  hasImage?: boolean
  validDate?: string
  isExpired?: boolean
  score?: number
  message: string
  hasDuplicate?: boolean
  duplicateCount?: number
  isSuspicious?: boolean
  suspiciousItems?: string[]
  city?: string
  vehicleType?: string
  requiredYears?: number
  requiredScore?: number
  requiredLevel?: number
  extraCheck?: boolean
}

export interface ViolationPoint {
  type: string
  name: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

export interface AuditStrictness {
  strictness: 'high' | 'normal'
  isNewDriver: boolean
  isLowReputation: boolean
  requireManualReview: boolean
  minCheckItems: number
  description: string
}

export interface DriverAuditLog {
  id: number
  driverId: number
  operationType: number
  operationTypeName: string
  oldStatus?: number
  newStatus?: number
  remark?: string
  qualificationCheck?: any
  operatorId?: number
  operatorName?: string
  createTime: string
}

export interface AuditDashboard {
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  exceptionCount: number
  expiredCount: number
  urgentCount: number
  lowReputationCount: number
  cityDistribution: Array<{
    city: string
    auditStatus: number
    count: number
  }>
  todayStart: string
}

export interface PreCheckViolation {
  type: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

export interface PreCheckResult {
  passed: boolean
  violations: PreCheckViolation[]
  warnings: PreCheckViolation[]
  violationCount: number
  complaintRate: number
  serviceScore: number
}

export interface PermissionChange {
  old: number
  new: number
}

export interface PermissionChanges {
  canAcceptOrder: PermissionChange
  canWithdraw: PermissionChange
  canGoOnline: PermissionChange
  trafficWeight: PermissionChange
}

export interface DriverStatusLog {
  id: number
  driverId: number
  operationType: number
  operationTypeName: string
  oldStatus?: number
  newStatus?: number
  oldRiskLevel?: number
  newRiskLevel?: number
  changeReason?: string
  preCheckResult?: PreCheckResult
  permissionChanges?: PermissionChanges
  effectiveTime?: string
  expireTime?: string
  isAbnormal: number
  abnormalReason?: string
  operatorId?: number
  operatorName?: string
  operatorRole?: string
  createTime: string
}

export interface RiskLevelResult {
  driverId: number
  riskLevel: number
  riskScore: number
  description: string
  oldRiskLevel?: number
  newRiskLevel?: number
}

export interface StatusDashboard {
  statusDistribution: {
    normal: number
    restricted: number
    tempBan: number
    permanentBan: number
  }
  riskDistribution: {
    low: number
    medium: number
    high: number
  }
  problemDrivers: {
    lowScore: number
    highComplaint: number
    highViolation: number
  }
  todayChangeCount: number
  total: number
}

export interface BatchStatusResult {
  id: number
  name: string
  success: boolean
  message: string
}

export interface BatchOperationStatusResult {
  total: number
  successCount: number
  failCount: number
  results: BatchStatusResult[]
}

export interface BlockedDriver {
  id: number
  name: string
  reason: string
}

export interface BatchPreCheckResult {
  canProceed: boolean
  warningMessages: string[]
  blockedDrivers: BlockedDriver[]
  statistics: {
    total: number
    normal: number
    restricted: number
    tempBan: number
    permanentBan: number
    highRisk: number
  }
}

export interface ServiceTrendData {
  date: string
  totalOrders: number
  completedOrders: number
  completionRate: number
  serviceScore: number
  complaintRate: number
  totalIncome: number
  onlineHours: number
  isAbnormal: boolean
  abnormalType?: string
}

export interface AbnormalItem {
  type: string
  field: string
  fieldName: string
  oldValue: number
  newValue: number
  changeRate: string
  direction: 'up' | 'down'
  severity: 'high' | 'medium' | 'low'
  message: string
}

export interface TrendAbnormality {
  date: string
  isAbnormal: boolean
  abnormalities: AbnormalItem[]
  abnormalType?: string
}

export interface ServiceAvgData {
  avgOrders: string
  avgScore: string
  avgComplaintRate: string
  avgIncome: string
}

export interface ServiceTrendResult {
  trendData: ServiceTrendData[]
  abnormalities: TrendAbnormality[]
  avgData: ServiceAvgData
  dateRange: { start: string; end: string }
  totalDays: number
}

export interface DataSource {
  name: string
  field: string
  status: 'ok' | 'warning' | 'error'
}

export interface DataAccuracy {
  accurate: boolean
  missingSources: string[]
  inconsistencies: string[]
  dataSources: DataSource[]
}

export interface DriverServiceLog {
  id: number
  driverId: number
  statDate: string
  operationType: number
  operationTypeName: string
  dataField?: string
  oldValue?: string
  newValue?: string
  dataSource?: string
  statisticBasis?: string
  isAbnormal: number
  abnormalType?: string
  abnormalReason?: string
  missingDataSource?: any[]
  operatorId?: number
  operatorName?: string
  remark?: string
  createTime: string
}

export interface DriverLevelInfo {
  level: number
  levelName: string
  description: string
  minServiceScore: number
  minCompletionRate: number
  maxComplaintRate: number
  minOrders: number
  trafficWeight: number
  subsidyLevel: number
  orderPriority: number
  config: any
}

export interface DriverServiceDetail {
  id: number
  driverId: number
  statDate: string
  statType: number
  totalOrders: number
  completedOrders: number
  completionRate: number
  cancelledOrders: number
  complaintCount: number
  complaintRate: number
  serviceScore: number
  totalIncome: number
  onlineHours: number
  orderAcceptRate: number
  avgOrderAmount: number
  mileage: number
  driverLevel: number
  isAbnormal: number
  abnormalType?: string
  abnormalReason?: string
  dataSources?: any
  trafficWeight: number
  subsidyLevel: number
  orderPriority: number
  levelInfo: DriverLevelInfo
  accuracy: DataAccuracy
  updateLogs: DriverServiceLog[]
}

export interface ServiceStatistics {
  summary: {
    totalOrders: number
    completedOrders: number
    avgServiceScore: number
    avgCompletionRate: number
    avgComplaintRate: number
    totalIncome: number
    driverCount: number
  }
  levelDistribution: {
    '优质': number
    '普通': number
    '待整改': number
    '劣质': number
  }
  dateRange: { start: string; end: string }
  period: string
}

export interface ExportProgress {
  percent: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  message: string
  total: number
  processed: number
}

export interface ExportFieldConfig {
  key: string
  label: string
  category: string
  permissionRequired?: boolean
  desensitized?: boolean
}

export interface ExportParams {
  period?: string
  startDate?: string
  endDate?: string
  driverIds?: number[]
  driverLevel?: number
  city?: string
  vehicleType?: string
  fields?: string[]
  sortField?: string
  sortOrder?: string
}

export interface ExportResult {
  data: any[]
  total: number
  dateRange: { start: string; end: string }
  allowedFields: string[]
  desensitizedFields: string[]
  hasPermission: boolean
}

export interface ServiceDataValidity {
  valid: boolean
  warnings: string[]
  dataCompleteness: number
}

export interface ServiceDataItem {
  id: number
  driverId: number
  statDate: string
  totalOrders: number
  completedOrders: number
  completionRate: number
  complaintCount: number
  complaintRate: number
  serviceScore: number
  totalIncome: number
  onlineHours: number
  driverLevel: number
  isAbnormal: number
  abnormalType?: string
  trafficWeight: number
  driver?: {
    name: string
    phone: string
    city: string
    vehicleType: string
    avatar?: string
  }
}

export interface ServiceDataListResult {
  list: ServiceDataItem[]
  total: number
  page: number
  pageSize: number
  dateRange: { start: string; end: string }
  validity: ServiceDataValidity
}

export interface BatchLevelResult {
  id: number
  success: boolean
  changed: boolean
  oldLevel?: number
  newLevel?: number
  message?: string
}

export interface BatchLevelUpdateResult {
  total: number
  successCount: number
  changedCount: number
  failCount: number
  results: BatchLevelResult[]
}

export interface Driver {
  id: number
  name: string
  phone: string
  idCard: string
  idCardImg: string
  idCardValidDate: string
  avatar: string
  driverLicenseNo: string
  driverLicenseImg: string
  driverLicenseValidDate: string
  driverLicenseType: string
  vehicleLicenseNo: string
  vehicleLicenseImg: string
  vehicleLicenseValidDate: string
  faceImg: string
  faceVerifyResult: number
  faceVerifyScore: number
  criminalRecordImg: string
  criminalRecordValidDate: string
  city: string
  vehicleType: string
  driverLevel: number
  reputationScore: number
  reputationLevel: number
  canAcceptOrder: number
  isUrgent: number
  qualificationStatus: number
  qualificationResult: QualificationCheck[]
  uploadProgress: number
  violationPoints: ViolationPoint[]
  status: number
  accountRiskLevel: number
  violationCount: number
  complaintCount: number
  complaintRate: number
  serviceScore: number
  onlineHours: number
  todayOnlineHours: number
  trafficWeight: number
  canWithdraw: number
  canGoOnline: number
  statusBanReason?: string
  statusBanStartTime?: string
  statusBanEndTime?: string
  abnormalStatusAlert: number
  abnormalStatusReason?: string
  auditStatus: number
  auditRemark: string
  auditTime: string
  auditorId: number
  totalOrders: number
  totalIncome: number
  rating: number
  balance: number
  vehicleId: number
  registerTime: string
  createTime: string
  updateTime: string
  auditStrictness?: AuditStrictness
}

export interface DriverQueryParams {
  page?: number
  pageSize?: number
  name?: string
  phone?: string
  status?: number
  auditStatus?: number
  city?: string
  vehicleType?: string
  reputationLevel?: number
  qualificationStatus?: number
  isUrgent?: number
  driverLevel?: number
  accountRiskLevel?: number
  minServiceScore?: number
  maxServiceScore?: number
  minComplaintRate?: number
  minViolationCount?: number
}

export interface BatchOperationResult {
  id: number
  success: boolean
  message: string
}

export interface QualificationCheckResult {
  driverId: number
  overallPassed: boolean
  checks: QualificationCheck[]
  violationPoints: ViolationPoint[]
}

export interface SettlementRuleViolation {
  field: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

export interface SettlementRulePreCheck {
  passed: boolean
  violations: SettlementRuleViolation[]
  warnings: SettlementRuleViolation[]
  commissionRate: number
  estimatedIncome: number
}

export interface ExclusiveRuleCheck {
  isExclusive: boolean
  conflicts: string[]
  conflictRules: number[]
}

export interface EstimatedIncome {
  totalOrders: number
  totalOrderAmount: number
  baseIncome: number
  estimatedTotal: number
}

export interface CalculationStep {
  type: 'base' | 'subsidy'
  name: string
  formula: string
  amount: number
}

export interface OrderIncomeResult {
  baseIncome: number
  hourSubsidy: number
  ratingSubsidy: number
  holidaySubsidy: number
  premiumIncome: number
  excellentSubsidy: number
  newDriverSubsidy: number
  penaltyAmount: number
  totalIncome: number
  platformCommission: number
  commissionRate: number
  appliedRules: number[]
  calculationDetail: CalculationStep[]
}

export interface CalculateIncomeResult {
  orderInfo: any
  matchedRules: any[]
  income: OrderIncomeResult
  calculationProcess: CalculationStep[]
}

export interface SettlementItem {
  id: number
  settlementRecordId: number
  orderId: number
  orderNo: string
  driverId: number
  orderType: number
  orderSource: string
  orderStartTime: string
  isPeakHour: number
  isHoliday: number
  isWeekend: number
  isPremium: number
  serviceRating: number
  orderAmount: number
  premiumAmount: number
  commissionRate: number
  baseIncome: number
  hourSubsidy: number
  ratingSubsidy: number
  holidaySubsidy: number
  premiumIncome: number
  penaltyAmount: number
  totalIncome: number
  platformCommission: number
  appliedRules: number[]
  calculationDetail: CalculationStep[]
  isAbnormal: number
  abnormalType?: string
  abnormalReason?: string
  matchCheckResult: any
  orderInfo?: any
  appliedRuleNames?: string[]
  createTime: string
}

export interface SettlementAuditLog {
  id: number
  settlementRecordId: number
  settlementItemId?: number
  operationType: number
  operationTypeName: string
  oldSettleStatus?: number
  newSettleStatus?: number
  oldAuditStatus?: number
  newAuditStatus?: number
  incomeChange?: any
  ruleChangeDetail?: any
  abnormalInterceptDetail?: any
  checkResult?: any
  rejectReason?: string
  operatorId?: number
  operatorName?: string
  operatorRole?: string
  remark?: string
  createTime: string
}

export interface SettlementRecord {
  id: number
  settlementNo: string
  driverId: number
  settlementType: number
  settleStatus: number
  periodStart: string
  periodEnd: string
  totalOrders: number
  totalOrderAmount: number
  baseIncome: number
  totalSubsidy: number
  hourSubsidy: number
  ratingSubsidy: number
  holidaySubsidy: number
  premiumSubsidy: number
  excellentSubsidy: number
  newDriverSubsidy: number
  penaltyAmount: number
  totalIncome: number
  platformCommission: number
  actualSettleAmount: number
  isAbnormal: number
  abnormalType?: string
  abnormalReason?: string
  rejectReason?: string
  isPosted: number
  postedTime?: string
  settleTime?: string
  voucherNo?: string
  auditStatus: number
  auditorId?: number
  auditorName?: string
  auditTime?: string
  createTime: string
  updateTime: string
  driver?: {
    name: string
    phone: string
    city: string
    vehicleType: string
    driverLevel: number
  }
  items?: SettlementItem[]
  auditLogs?: SettlementAuditLog[]
}

export interface SettlementTrace {
  record: SettlementRecord
  items: SettlementItem[]
  auditLogs: SettlementAuditLog[]
}

export interface SettlementBatchResult {
  total: number
  successCount: number
  failCount: number
  results: Array<{
    id: number
    success: boolean
    message?: string
  }>
}

export interface SettlementStatistics {
  total: number
  pending: number
  processing: number
  settled: number
  posted: number
  abnormal: number
  rejected: number
  totalIncome: number
  totalSubsidy: number
  totalCommission: number
  levelDistribution: Record<number, number>
  cityDistribution: Record<string, number>
  todayCreated: number
  todaySettled: number
}

export interface SettlementQueryParams {
  page?: number
  pageSize?: number
  driverName?: string
  settleStatus?: number
  settlementType?: number
  isAbnormal?: number
  isPosted?: number
  periodStart?: string
  periodEnd?: string
  driverLevel?: number
}

export interface SettlementRule {
  id: number
  ruleName: string
  ruleType: number
  applyScope: number
  applyDriverLevels?: number[]
  applyCities?: string[]
  applyVehicleTypes?: string[]
  applyOrderTypes?: number[]
  commissionRate: number
  minCommissionRate: number
  maxCommissionRate: number
  subsidyAmount: number
  subsidyPercent: number
  timeStart?: string
  timeEnd?: string
  isHoliday: number
  isWeekend: number
  minServiceRating: number
  isExclusive: number
  exclusiveRuleIds?: number[]
  priority: number
  status: number
  effectiveStart?: string
  effectiveEnd?: string
  isDefault: number
  description?: string
  creatorId?: number
  creatorName?: string
  createTime: string
  updateTime: string
}

export interface MatchCheckResult {
  orderMatch: boolean
  ruleMatch: boolean
  amountMatch: boolean
  subsidyMatch: boolean
  details: string[]
}

