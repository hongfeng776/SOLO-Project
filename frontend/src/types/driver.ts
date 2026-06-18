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
