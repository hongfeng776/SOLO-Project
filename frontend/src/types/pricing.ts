export type RuleType = 1 | 2 | 3 | 4 | 5

export interface PricingRule {
  id: number
  ruleName: string
  ruleType: RuleType
  capacityType: number | null
  cityCode: string | null
  cityName: string | null
  timePeriod: string | null
  startTime: string | null
  endTime: string | null
  weatherCondition: string | null
  holidayType: string | null
  basePrice: number
  perKmPrice: number
  perMinPrice: number
  minCharge: number
  surgeRatio: number
  maxSurgeAmount: number
  maxTotalPrice: number
  isMutuallyExclusive: number
  priority: number
  effectiveDateStart: string | null
  effectiveDateEnd: string | null
  status: number
  description: string | null
  createTime: string
  updateTime: string
}

export interface BillingItem {
  ruleId: number
  ruleName: string
  ruleType: number
  basePrice?: number
  perKmPrice?: number
  perMinPrice?: number
  surgeRatio: number
  distanceFee?: number
  durationFee?: number
  itemTotal?: number
  surgeAmount?: number
  maxSurgeAmount?: number
  isMutuallyExclusive: number
}

export interface ValidationIssue {
  field: string
  message: string
  level: 'error' | 'warning' | 'info' | 'success'
}

export interface BillingValidation {
  isValid: boolean
  score: number
  exceptions: ValidationIssue[]
  warnings: ValidationIssue[]
  passItems: ValidationIssue[]
}

export interface BillingDetailData {
  orderId: number
  orderNo: string
  distance: number
  duration: number
  basePrice: number
  perKmPrice: number
  perMinPrice: number
  minCharge: number
  totalBasePrice: number
  totalDistanceFee: number
  totalDurationFee: number
  totalSurgeAmount: number
  estimatedTotal: number
  billingItems: BillingItem[]
  timeInfo: {
    period: string
    startTime: string
    endTime: string
  }
  holidayType: string
  weatherCondition: string
  appliedRules: Array<{ id: number; name: string }>
  hasExclusiveRule: boolean
  validation: BillingValidation
  industryThreshold: number
  surgeLimit: number
}

export interface PricingChangeLogItem {
  id: number
  orderId: number | null
  orderNo: string | null
  ruleId: number | null
  ruleName: string | null
  changeType: string
  operatorId: number | null
  operatorName: string | null
  operatorIP: string | null
  oldValue: any
  newValue: any
  billingDetail: BillingDetailData | null
  priceDiff: number
  appliedRules: string | null
  validationResult: string | null
  hasException: number
  exceptionType: string | null
  exceptionDetail: string | null
  remark: string | null
  createTime: string
}

export interface BillingTraceData {
  order: any
  currentBilling: BillingDetailData
  changeHistory: Array<{
    id: number
    changeType: string
    operatorName: string | null
    operatorIP: string | null
    createTime: string
    oldValue: any
    newValue: any
    priceDiff: number
    hasException: number
    exceptionType: string | null
    exceptionDetail: string | null
    remark: string | null
  }>
  appliedRules: Array<{ id: number; name: string }>
  validation: BillingValidation
  riskChecks: Array<{
    type: string
    level: string
    message: string
  }>
}

export interface PricingValidationResult {
  estimatedTotal: number
  validation: BillingValidation
  industryThreshold: number
  surgeLimit: number
}

export interface BillingScenarioItem {
  value: string | number
  label: string
  hasSurcharge?: boolean
}

export interface BillingScenario {
  key: string
  name: string
  items: BillingScenarioItem[]
}

export interface BatchAdjustFilter {
  cityCode?: string
  capacityType?: number
  timePeriod?: string
  startTime?: string
  endTime?: string
}

export interface BatchAdjustParams {
  filter: BatchAdjustFilter
  adjustParams: {
    surgeRatio?: number
    perKmPriceAdjust?: number
  }
}

export interface BatchAdjustResult {
  total: number
  excludedCount: number
  excludedOrders: Array<{ id: number; orderNo: string; reason: string }>
  success: number
  failed: number
  failedOrders: Array<{ id: number; orderNo?: string; reason: string }>
  progress: number
}
