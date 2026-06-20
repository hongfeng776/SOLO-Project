export interface CapacityType {
  id: number
  name: string
  code: string
  basePrice: number
  perKmPrice: number
  perMinPrice: number
  minCharge: number
  description: string
  status: number
  createTime: string
  updateTime: string
}

export interface CapacityStatus {
  code: 'normal' | 'saturated' | 'shortage' | 'surplus'
  label: string
  severity: 'success' | 'warning' | 'danger' | 'info'
  color: string
}

export interface CapacityPermission {
  canViewAll: boolean
  canDispatch: boolean
  canExport: boolean
  userRole: string
}

export interface CapacityMonitorSummary {
  totalOnline: number
  totalInOrder: number
  totalIdle: number
  totalOrders: number
  utilizationRate: number
  currentStatus: CapacityStatus
  permission: CapacityPermission
}

export interface TypeDistribution {
  type: number
  typeName: string
  onlineCount: number
  inOrderCount: number
  idleCount: number
  orderCount: number
  saturationRate: number
}

export interface AreaDistrict {
  area: string
  onlineCount: number
  orderCount: number
  idleCount: number
  status: string
}

export interface AreaDistribution {
  city: string
  districts: AreaDistrict[]
}

export interface FilterOptions {
  cities: string[] | null
  businessDistricts: string[]
  timePeriods: string[]
}

export interface CapacityMonitorData {
  summary: CapacityMonitorSummary
  typeDistribution: TypeDistribution[]
  areaDistribution: AreaDistribution[]
  filterOptions: FilterOptions
  timestamp: string
  conflicts?: string[]
}

export interface AbnormalArea {
  id: string
  city: string
  district: string
  orderCount: number
  onlineCount: number
  idleCount: number
  status: string
  gap: number
  trend: string
}

export interface AbnormalPeriod {
  period: string
  orderCount: number
  onlineCount: number
  idleCount: number
  status: string
  gap: number
}

export interface CapacityWarning {
  id: number
  type: string
  title: string
  message: string
  timestamp: string
  autoDispatch: boolean
}

export interface CapacityStatusDetail {
  currentStatus: CapacityStatus
  abnormalAreas: AbnormalArea[]
  abnormalPeriods: AbnormalPeriod[]
  warnings: CapacityWarning[]
  statistics: {
    totalOrders: number
    totalOnline: number
    totalIdle: number
    shortageAreas: number
    surplusAreas: number
  }
}

export interface DispatchResultDetail {
  driverId: number
  driverName: string
  phone: string
  city: string
  status: 'success' | 'failed'
  reason?: string
}

export interface DispatchResults {
  totalSelected: number
  inOrderDrivers: number
  skippedInOrder: number
  successCount: number
  failedCount: number
  details: DispatchResultDetail[]
}

export interface BatchDispatchResponse {
  results: DispatchResults
  operationType: string
  targetAreas: string[]
  targetPeriods: string[]
  timestamp: string
}

export interface TrendDataPoint {
  timestamp: string
  onlineCount: number
  idleCount: number
  orderCount: number
  city: string
}

export interface SuspiciousDataPoint extends TrendDataPoint {
  issues: string[]
  isSuspicious: boolean
}

export interface GapPoint {
  timestamp: string
  city: string
  gap: number
  severity: 'high' | 'medium'
}

export interface SurplusPoint {
  timestamp: string
  city: string
  surplus: number
  severity: 'high' | 'medium'
}

export interface ValidationCheck {
  name: string
  passed: boolean
}

export interface ValidationResult {
  totalRecords: number
  suspiciousRecords: number
  abnormalDrivers: number
  validationPassed: boolean
  checks: ValidationCheck[]
}

export interface CapacityTrendData {
  trendData: TrendDataPoint[]
  suspiciousData: SuspiciousDataPoint[]
  validationResult: ValidationResult
  gapPoints: GapPoint[]
  surplusPoints: SurplusPoint[]
  summary: {
    avgOnline: number
    avgOrders: number
    peakHour: string
    valleyHour: string
    maxGap: number
    maxSurplus: number
  }
}

export interface CityBreakdown {
  city: string
  onlineCount: number
  orderCount: number
  completionRate: number
  avgResponseTime: string
  status: string
}

export interface PeriodBreakdown {
  period: string
  orderCount: number
  onlineCount: number
  idleCount: number
  avgWaitTime: string
  cancelRate: string
}

export interface ReportRecommendation {
  priority: 'high' | 'medium' | 'low'
  type: 'shortage' | 'surplus' | 'optimization'
  content: string
}

export interface CapacityReport {
  reportNo: string
  reportType: string
  generatedBy: string
  generatedAt: string
  period: {
    startDate: string
    endDate: string
  }
  scope: string
  summary: {
    totalOnlineDrivers: number
    totalOrders: number
    completedOrders: number
    completionRate: number
    avgUtilizationRate: number
    overallStatus: CapacityStatus
  }
  cityBreakdown: CityBreakdown[]
  periodBreakdown: PeriodBreakdown[]
  recommendations: ReportRecommendation[]
  appendices: {
    dataSource: string
    dataAccuracy: string
    lastUpdated: string
  }
}

export interface CapacityMonitor {
  totalOnline: number
  totalInOrder: number
  totalIdle: number
  typeDistribution: Array<{
    type: number
    typeName: string
    onlineCount: number
    inOrderCount: number
  }>
  hotAreas: Array<{
    area: string
    orderCount: number
    driverCount: number
  }>
}

export interface MonitorFilters {
  city?: string
  businessDistrict?: string
  timePeriod?: string
  startTime?: string
  endTime?: string
}

export interface BatchDispatchParams {
  areaIds?: string[]
  periodIds?: string[]
  operationType: 'dispatch_task' | 'online_reminder'
  message?: string
  targetCities?: string[]
}

export interface ReportParams {
  city?: string
  startDate: string
  endDate: string
  reportType?: 'comprehensive' | 'shortage' | 'surplus' | 'trend'
}

export interface SmartDispatchPrecheckParams {
  city: string
  area: string
  dispatchType: 'manual' | 'auto' | 'emergency'
  maxDispatchRadius: number
  maxDispatchCount: number
  dispatchTimeout: number
}

export interface AreaAnalysis {
  area: string
  city: string
  orderHeat: 'low' | 'medium' | 'high' | 'extreme'
  orderHeatScore: number
  driverDensity: number
  idleDriverCount: number
  trafficLevel: 'smooth' | 'slow' | 'congested' | 'blocked'
  congestionAreas: string[]
  highDensityAreas: string[]
  recommendedPriority: 'high' | 'medium' | 'low'
  parameterValidation: {
    maxDispatchRadius: { valid: boolean; message?: string }
    maxDispatchCount: { valid: boolean; message?: string }
    dispatchTimeout: { valid: boolean; message?: string }
  }
}

export interface SmartDispatchPrecheckResult {
  areaAnalysis: AreaAnalysis
  canDispatch: boolean
  warnings: string[]
  suggestions: string[]
}

export interface MatchDriver {
  driverId: number
  driverName: string
  phone: string
  distance: number
  serviceScore: number
  loadStatus: number
  currentOrders: number
  matchScore: number
  scoreBreakdown: {
    urgencyScore: number
    distanceScore: number
    serviceScore: number
    loadScore: number
  }
}

export interface SmartMatchParams {
  orderId: number
  priority: 'urgent' | 'normal' | 'low'
  targetArea: string
  matchParams?: {
    maxDistance?: number
    minServiceScore?: number
    maxLoad?: number
  }
}

export interface SmartMatchResult {
  orderId: number
  matchedDriver: MatchDriver | null
  matchTime: number
  matchLogic: string
  priorityWeights: {
    urgency: number
    distance: number
    serviceScore: number
    load: number
  }
  orderStatus: number
  driverLoadUpdated: boolean
  timestamp: string
}

export interface BatchSmartDispatchParams {
  operation: 'dispatch_to_gap' | 'adjust_weight' | 'cancel_invalid'
  targetAreaIds: string[]
  periodStrategies?: Array<{
    period: string
    weightMultiplier: number
    dispatchRadius: number
  }>
  weightParams?: {
    areaId: string
    weight: number
  }[]
  cancelReason?: string
}

export interface BatchSmartDispatchResult {
  operation: string
  totalTargets: number
  successCount: number
  failedCount: number
  skippedCount: number
  details: Array<{
    targetId: string
    targetName: string
    status: 'success' | 'failed' | 'skipped'
    reason?: string
    affectedDrivers?: number
  }>
  refreshedAreas: Array<{
    areaId: string
    areaName: string
    onlineCount: number
    idleCount: number
    orderCount: number
  }>
  timestamp: string
}

export interface DispatchTraceRecord {
  taskId: string
  triggerTime: string
  triggerType: 'manual' | 'auto' | 'batch'
  triggerCondition: string
  targetArea: string
  targetCity: string
  matchingLogic: string
  matchedDriverId: number | null
  matchedDriverName: string | null
  executionResult: 'success' | 'failed' | 'cancelled' | 'intercepted'
  executionDuration: number
  orderStatus: number
  driverLoadBefore: number
  driverLoadAfter: number
  validationFlags: string[]
  isInvalid: boolean
  isRepeated: boolean
  isCrossRegion: boolean
}

export interface DispatchTraceValidation {
  totalTasks: number
  invalidDispatches: number
  repeatedDispatches: number
  crossRegionViolations: number
  validationChecks: Array<{
    name: string
    passed: boolean
    detail: string
  }>
  overallPassed: boolean
}

export interface AlgorithmOptimization {
  parameter: string
  currentValue: number
  suggestedValue: number
  reason: string
  impact: 'high' | 'medium' | 'low'
}

export interface DispatchTraceResult {
  traces: DispatchTraceRecord[]
  validation: DispatchTraceValidation
  optimizations: AlgorithmOptimization[]
  summary: {
    avgMatchTime: number
    successRate: number
    topGapAreas: string[]
    topInterceptReasons: string[]
  }
  timestamp: string
}
