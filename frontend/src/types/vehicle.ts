export interface Vehicle {
  id: number
  plateNumber: string
  vin: string
  engineNo: string
  brand: string
  model: string
  color: string
  capacityType: number
  seats: number
  displacement: number
  emissionStandard: number
  vehicleType: number
  vehicleImg: string
  drivingLicenseImg: string
  insuranceImg: string
  inspectionImg: string
  registrationDate: string
  inspectionDate: string
  insuranceDate: string
  drivingLicenseDate: string
  drivingLicenseExpiry: string
  inspectionExpiry: string
  insuranceExpiry: string
  manufactureDate: string
  operationLevel: number
  orderScope: OrderScope
  premiumPermission: number
  operationTimeLimit: number
  totalScore: number
  levelResult?: RecalculateLevelResult
  status: number
  auditStatus: number
  auditRemark: string
  auditTime: string
  auditorId: number
  city: string
  isLocked: number
  lockReason: string
  validationResult: ValidationResult
  riskLevel: number
  trafficDataVerified: number
  driverId: number | null
  driverName: string | null
  ownerName: string
  ownerIdCard: string
  ownerPhone: string
  ownerAddress: string
  createTime: string
  updateTime: string
  levelPrivileges?: LevelPrivileges
  auditLogs?: VehicleAuditLog[]
}

export interface OrderScope {
  maxRadius: number
  allowAirport: boolean
  allowBusiness: boolean
  allowLongDistance: boolean
  peakPriority: boolean
}

export interface ValidationResult {
  valid: boolean
  passed: ValidationItem[]
  failed: ValidationItem[]
  warnings: ValidationItem[]
  risks: RiskItem[]
}

export interface ValidationItem {
  field: string
  valid: boolean
  message: string
  warning?: boolean
  expired?: boolean
  unique?: boolean
}

export interface RiskItem {
  level: 'low' | 'medium' | 'high'
  type: string
  message: string
}

export interface LevelPrivileges {
  level: string
  orderScope: string
  premiumPermission: string
  operationTimeLimit: string
  priority: string
  features: string[]
}

export interface VehicleAuditLog {
  id: number
  vehicleId: number
  plateNumber: string
  operationType: number
  operationTypeName: string
  oldAuditStatus: number
  newAuditStatus: number
  oldStatus: number
  newStatus: number
  oldOperationLevel: number
  newOperationLevel: number
  remark: string
  validationResult: ValidationResult
  changedFields: Record<string, { old: any; new: any }>
  riskLevel: number
  operatorId: number
  operatorName: string
  operatorRole?: string
  ipAddress?: string
  levelResult?: RecalculateLevelResult
  validationSummary?: {
    documents: boolean
    parameters: boolean
    uniqueness: boolean
    trafficData: boolean
  }
  createdAt: string
  createTime: string
}

export interface VehicleQueryParams {
  page?: number
  pageSize?: number
  plateNumber?: string
  brand?: string
  capacityType?: number
  status?: number
  auditStatus?: number
  operationLevel?: number
  city?: string
  isLocked?: number
  vin?: string
}

export interface LevelBreakdownItem {
  item: string
  value: string
  score: number
}

export interface BatchImportResult {
  success: Array<{
    row: number
    id: number
    plateNumber: string
    level: string
    score: number
  }>
  failed: Array<{
    row: number
    data: any
    errors: string[]
    type: string
    risks?: RiskItem[]
  }>
  warnings: Array<{
    row: number
    plateNumber: string
    warnings: string[]
  }>
  total: number
}

export interface BatchOperationResult {
  success: Array<{ id: number; plateNumber: string }>
  failed: Array<{ id: number; plateNumber?: string; error: string }>
  total: number
}

export interface ImportTemplate {
  fields: Array<{
    key: string
    label: string
    required: boolean
    example: string
    description: string
  }>
  example: Record<string, string>
}

export interface RecalculateLevelResult {
  level: number
  levelName: string
  totalScore: number
  breakdown: LevelBreakdownItem[]
  privileges: LevelPrivileges
  levelChanged: boolean
}
