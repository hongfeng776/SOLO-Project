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
}
