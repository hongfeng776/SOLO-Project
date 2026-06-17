import request from '@/utils/request'
import type { PageResult } from '@/utils/request'
import type {
  PricingRule,
  BillingDetailData,
  PricingChangeLogItem,
  BatchAdjustParams,
  BillingTraceData,
  PricingValidationResult,
  BillingScenario,
  RuleType
} from '@/types/pricing'

export const getPricingRuleListApi = (params: {
  page?: number
  pageSize?: number
  ruleType?: RuleType
  status?: number
  capacityType?: number
  cityCode?: string
}) => {
  return request.get<PageResult<PricingRule>>('/pricing/rules', params)
}

export const getPricingRuleDetailApi = (id: number) => {
  return request.get<PricingRule>(`/pricing/rules/${id}`)
}

export const createPricingRuleApi = (data: Partial<PricingRule>) => {
  return request.post<PricingRule>('/pricing/rules', data)
}

export const updatePricingRuleApi = (id: number, data: Partial<PricingRule>) => {
  return request.put<PricingRule>(`/pricing/rules/${id}`, data)
}

export const deletePricingRuleApi = (id: number) => {
  return request.delete(`/pricing/rules/${id}`)
}

export const calculateBillingApi = (orderId: number, params?: { weather?: string; date?: string }) => {
  return request.get<BillingDetailData>(`/pricing/calculate/${orderId}`, params)
}

export const updateOrderBillingApi = (orderId: number, data: {
  basePrice?: number
  perKmPrice?: number
  perMinPrice?: number
  nightSurcharge?: number
  surgeRatio?: number
}) => {
  return request.put(`/pricing/update-billing/${orderId}`, data)
}

export const getPricingChangeLogsApi = (orderId: number, params?: { page?: number; pageSize?: number }) => {
  return request.get<PageResult<PricingChangeLogItem>>(`/pricing/logs/${orderId}`, params)
}

export const batchAdjustPricingApi = (data: {
  filter: {
    cityCode?: string
    capacityType?: number
    timePeriod?: string
    startTime?: string
    endTime?: string
  }
  adjustParams: {
    surgeRatio?: number
    perKmPriceAdjust?: number
  }
}) => {
  return request.post('/pricing/batch-adjust', data)
}

export const getBillingTraceApi = (orderId: number) => {
  return request.get<BillingTraceData>(`/pricing/trace/${orderId}`)
}

export const validatePricingEditApi = (data: {
  basePrice?: number
  perKmPrice?: number
  perMinPrice?: number
  surgeRatio?: number
  distance?: number
  duration?: number
}) => {
  return request.post<PricingValidationResult>('/pricing/validate-edit', data)
}

export const getApplicableScenariosApi = () => {
  return request.get<BillingScenario[]>('/pricing/scenarios')
}
