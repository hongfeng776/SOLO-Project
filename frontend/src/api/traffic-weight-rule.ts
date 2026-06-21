import { get, post, put } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  TrafficWeightRule,
  TrafficWeightRuleLog,
  WeightRuleValidationResult,
  WeightRuleStats,
  WeightRuleBatchResult,
  WeightRuleImpactAnalysis
} from '@/types/business'

export function getTrafficWeightRuleList(params: any) {
  return get<PageResult<TrafficWeightRule>>('/api/traffic-weight-rule', params)
}

export function getTrafficWeightRuleDetail(id: number) {
  return get<TrafficWeightRule>(`/api/traffic-weight-rule/${id}`)
}

export function validateTrafficWeightRule(data: any) {
  return post<WeightRuleValidationResult>('/api/traffic-weight-rule/validate', data)
}

export function createTrafficWeightRule(data: any) {
  return post<{ success: boolean; ruleId?: number; ruleCode?: string; errors?: string[]; blockReason?: string; blockDetail?: string }>('/api/traffic-weight-rule', data)
}

export function updateTrafficWeightRule(id: number, data: any) {
  return put<any>(`/api/traffic-weight-rule/${id}`, data)
}

export function enableTrafficWeightRule(id: number, reason?: string) {
  return put<any>(`/api/traffic-weight-rule/${id}/enable`, { reason })
}

export function disableTrafficWeightRule(id: number, reason?: string) {
  return put<any>(`/api/traffic-weight-rule/${id}/disable`, { reason })
}

export function adjustTrafficWeightRule(id: number, data: any) {
  return put<any>(`/api/traffic-weight-rule/${id}/adjust`, data)
}

export function batchTrafficWeightRule(data: {
  operation: 'enable' | 'disable' | 'adjust' | 'delete'
  ids?: number[]
  filter?: Record<string, any>
  targetWeights?: Record<string, number>
  reason?: string
}) {
  return post<WeightRuleBatchResult>('/api/traffic-weight-rule/batch', data)
}

export function recalcTrafficWeightRule(id: number) {
  return put<any>(`/api/traffic-weight-rule/${id}/recalc`, {})
}

export function getTrafficWeightRuleStats() {
  return get<WeightRuleStats>('/api/traffic-weight-rule/stats')
}

export function getTrafficWeightRuleLogs(params: any) {
  return get<PageResult<TrafficWeightRuleLog>>('/api/traffic-weight-rule/logs/list', params)
}

export function getTrafficWeightRuleImpact(id: number) {
  return get<WeightRuleImpactAnalysis>(`/api/traffic-weight-rule/${id}/impact`)
}
