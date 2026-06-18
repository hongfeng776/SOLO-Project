import request from '@/utils/request'
import type {
  SettlementRecord,
  SettlementRule,
  SettlementRulePreCheck,
  ExclusiveRuleCheck,
  EstimatedIncome,
  CalculateIncomeResult,
  SettlementTrace,
  SettlementBatchResult,
  SettlementStatistics,
  SettlementQueryParams
} from '@/types/driver'
import type { PageResult } from '@/utils/request'

export const getSettlementListApi = (params: SettlementQueryParams) => {
  return request.get<PageResult<SettlementRecord>>('/settlement/list', params)
}

export const createSettlementApi = (data: {
  driverId: number
  periodStart: string
  periodEnd: string
  orderIds?: number[]
  settlementType?: number
}) => {
  return request.post<SettlementRecord>('/settlement', data)
}

export const getSettlementDetailApi = (id: number) => {
  return request.get<SettlementTrace>(`/settlement/${id}`)
}

export const initiateSettlementApi = (id: number) => {
  return request.put<SettlementRecord>(`/settlement/${id}/initiate`)
}

export const auditSettlementApi = (id: number, passed: boolean, rejectReason?: string) => {
  return request.put<SettlementRecord>(`/settlement/${id}/audit`, { passed, rejectReason })
}

export const postSettlementApi = (id: number) => {
  return request.put<SettlementRecord>(`/settlement/${id}/post`)
}

export const batchInitiateSettlementApi = (ids: number[]) => {
  return request.post<SettlementBatchResult>('/settlement/batch-initiate', { ids })
}

export const batchAuditSettlementApi = (ids: number[], passed: boolean, rejectReason?: string) => {
  return request.post<SettlementBatchResult>('/settlement/batch-audit', { ids, passed, rejectReason })
}

export const batchRejectSettlementApi = (ids: number[], rejectReason?: string) => {
  return request.post<SettlementBatchResult>('/settlement/batch-reject', { ids, rejectReason })
}

export const getRuleListApi = (params: {
  status?: number
  ruleType?: number
  applyScope?: number
  page?: number
  pageSize?: number
}) => {
  return request.get<PageResult<SettlementRule>>('/settlement/rules', params)
}

export const preCheckRuleApi = (rule: Partial<SettlementRule>, driverId?: number) => {
  return request.post<SettlementRulePreCheck>('/settlement/rules/pre-check', { rule, driverId })
}

export const checkExclusiveRuleApi = (driverId: number, ruleType: number) => {
  return request.post<ExclusiveRuleCheck>('/settlement/rules/check-exclusive', { driverId, ruleType })
}

export const estimateIncomeApi = (driverId: number, ruleChanges?: Partial<SettlementRule>) => {
  return request.post<EstimatedIncome>('/settlement/rules/estimate-income', { driverId, ruleChanges })
}

export const createRuleApi = (data: Partial<SettlementRule>) => {
  return request.post<{ rule: SettlementRule; preCheck: SettlementRulePreCheck }>('/settlement/rules', data)
}

export const updateRuleApi = (id: number, data: Partial<SettlementRule>) => {
  return request.put<{ rule: SettlementRule; preCheck: SettlementRulePreCheck }>(`/settlement/rules/${id}`, data)
}

export const deleteRuleApi = (id: number) => {
  return request.delete(`/settlement/rules/${id}`)
}

export const calculateOrderIncomeApi = (driverId: number, orderId: number) => {
  return request.post<CalculateIncomeResult>('/settlement/calculate-income', { driverId, orderId })
}

export const getSettlementStatisticsApi = (params?: any) => {
  return request.get<SettlementStatistics>('/settlement/statistics', params)
}

export const generateVoucherApi = () => {
  return request.get<{ voucherNo: string }>('/settlement/generate-voucher')
}
