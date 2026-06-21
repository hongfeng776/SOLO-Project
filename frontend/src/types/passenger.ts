export interface Passenger {
  id: number
  nickname: string
  phone: string
  avatar: string
  gender: number
  totalOrders: number
  totalSpend: number
  rating: number
  status: number
  createTime: string
  updateTime: string
  realName: string
  idCard: string
  idCardFront: string
  idCardBack: string
  realNameStatus: number
  realNameTime: string
  realNameExpireTime: string
  province: string
  city: string
  district: string
  address: string
  zipCode: string
  level: number
  levelScore: number
  reputationScore: number
  tags: string[]
  securityLevel: number
  isRisk: boolean
  lastLoginTime: string
  lastLoginIp: string
  registerChannel: string
  orderFrequency: number
  auditLogs: PassengerAuditLog[]
  operationLogs: PassengerOperationLog[]
  cancelCount: number
  cancelRate: number
  lateCount: number
  complaintCount: number
  maliciousComplaintCount: number
  travelRiskLevel: number
  travelRiskScore: number
  isOrderRestricted: boolean
  isPremiumDiscountRestricted: boolean
  riskRestrictionStartTime: string
  riskRestrictionEndTime: string
  travelCity: string
  activityLevel: number
  consumptionLevel: number
  avgConsumptionPerOrder: number
}

export interface PassengerAuditLog {
  id: number
  passengerId: number
  operatorId: number
  operatorName: string
  operationType: string
  beforeData: any
  afterData: any
  changeReason: string
  status: number
  remark: string
  createTime: string
}

export interface PassengerOperationLog {
  id: number
  passengerId: number
  operationType: string
  beforeValue: any
  afterValue: any
  operatorType: number
  operatorId: number
  ip: string
  deviceInfo: string
  riskLevel: number
  isBlocked: boolean
  blockReason: string
  verifyResult: string
  createTime: string
}

export interface ValidationResult {
  valid: boolean
  message: string
  canEdit?: Record<string, boolean>
}

export interface LevelCalculateResult {
  oldLevel: number
  newLevel: number
  benefitsChanged: string[]
  tags: string[]
}

export interface BatchOperationResult {
  successCount: number
  failCount: number
  results: Array<{ id: number; success: boolean; message: string }>
}

export interface RiskOverview {
  riskRecords: any[]
  abnormalOperations: number
  levelAbnormal: boolean
  recentEditCount: number
  hasDuplicateRealName: boolean
  hasFakeRealName: boolean
  hasMaliciousPhoneChange: boolean
}

export interface PassengerQueryParams {
  page?: number
  pageSize?: number
  nickname?: string
  phone?: string
  status?: number
  realNameStatus?: number
  level?: number
  minReputationScore?: number
  maxReputationScore?: number
  isRisk?: boolean
  registerChannel?: string
  tag?: string
  registerStartDate?: string
  registerEndDate?: string
  minOrderFrequency?: number
  maxOrderFrequency?: number
  minTotalOrders?: number
  maxTotalOrders?: number
  travelRiskLevel?: number
  activityLevel?: number
  consumptionLevel?: number
}

export interface PassengerTravelRisk {
  id: number
  passengerId: number
  orderId: number | null
  orderNo: string | null
  riskType: number
  riskLevel: number
  riskScore: number
  evidence: any
  description: string
  isBlocked: boolean
  blockReason: string | null
  status: number
  handlerId: number | null
  handlerName: string | null
  handleRemark: string | null
  handleTime: string | null
  triggeredRestrictions: string[] | null
  order?: any
  createTime: string
}

export interface PassengerExportTask {
  id: number
  taskNo: string
  taskName: string
  operatorId: number
  operatorName: string
  exportType: number
  filterParams: any
  sortRules: any[]
  fieldList: string[]
  isDesensitized: boolean
  desensitizeRules: any
  status: number
  totalCount: number
  exportedCount: number
  failedCount: number
  filePath: string | null
  fileName: string | null
  fileSize: number
  errorMessage: string | null
  expireTime: string
  createTime: string
}

export interface PassengerBehaviorReport {
  id: number
  reportNo: string
  passengerId: number
  passengerName: string
  reportType: number
  triggerType: number | null
  periodStart: string
  periodEnd: string
  statistics: {
    totalOrders: number
    cancelOrders: number
    completeOrders: number
    cancelRate: string
    totalAmount: string
    avgAmount: string
    riskCount: number
    highRiskCount: number
  }
  abnormalBehaviors: Array<{
    type: number
    name: string
    level: number
    description: string
    time: string
  }>
  riskAssessment: {
    cancelRisk: string
    complaintRisk: string
    overallScore: number
  }
  recommendations: string[]
  overallRiskLevel: number
  overallRiskScore: string
  suggestedActions: string[]
  status: number
  reviewerId: number | null
  reviewerName: string | null
  reviewRemark: string | null
  reviewTime: string | null
  executedActions: string[] | null
  createTime: string
}

export interface TravelRecordQueryParams {
  page?: number
  pageSize?: number
  startTime?: string
  endTime?: string
  travelCity?: string
  capacityType?: number
  minAmount?: number
  maxAmount?: number
  status?: number
}

export interface TravelRiskCalcResult {
  oldRiskLevel: number
  newRiskLevel: number
  riskScore: number
  cancelRate: number
  maliciousComplaints: number
  restrictionsChanged: string[]
  isOrderRestricted: boolean
  isPremiumDiscountRestricted: boolean
}

export interface TravelPermissionResult {
  canViewFull: boolean
  currentRole: string
  allowedRoles: string[]
  allowedRoleNames: string[]
  message: string
}

export interface TravelTraceDetail {
  order: any
  risks: PassengerTravelRisk[]
  abnormalDetection: {
    hasAbnormal: boolean
    abnormalTypes: Array<{ type: string; name: string; level: string }>
    sameTimeOrders: number
    fakeComplaints: number
  }
}

export interface SortRule {
  field: string
  order: 'asc' | 'desc'
}

export interface ExportTaskCreateParams {
  taskName: string
  exportType?: number
  filterParams?: any
  sortRules?: SortRule[]
  fieldList?: string[]
  isDesensitized?: boolean
}
