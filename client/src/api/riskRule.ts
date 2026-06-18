import { get, post, put, del } from '@utils/request'
import type {
  IApiResponse,
  IPaginatedData,
  IRiskRule,
  IRiskRuleListParams,
  IRiskRuleCreateData,
  IRiskRuleUpdateData,
  IRiskRuleValidationResult,
  IRiskRuleCompatibilityCheck,
  IRiskRuleHistoryResult,
  IBatchOperationResult,
  IBatchOperationProgress,
  IRiskRuleScenarioMatch,
} from '@/types/api'
import { BatchOperationType, RiskRuleType } from '@/enums'

export function getRiskRuleList(params: IRiskRuleListParams): Promise<IApiResponse<IPaginatedData<IRiskRule>>> {
  return get<IPaginatedData<IRiskRule>>('/api/risk-rules', params)
}

export function getRiskRuleById(id: number): Promise<IApiResponse<IRiskRule>> {
  return get<IRiskRule>(`/api/risk-rules/${id}`)
}

export function getActiveRiskRules(customerLevel?: string): Promise<IApiResponse<IRiskRule[]>> {
  return get<IRiskRule[]>('/api/risk-rules/active', customerLevel ? { customerLevel } : {})
}

export function validateRiskRuleParams(data: Partial<IRiskRuleCreateData>): Promise<IApiResponse<IRiskRuleValidationResult>> {
  return post<IRiskRuleValidationResult>('/api/risk-rules/validate', data)
}

export function checkRiskRuleCompatibility(
  data: Partial<IRiskRuleCreateData> & { excludeId?: number },
): Promise<IApiResponse<IRiskRuleCompatibilityCheck>> {
  return post<IRiskRuleCompatibilityCheck>('/api/risk-rules/check-compatibility', data)
}

export function checkEffectivePeriod(
  data: { effectiveStart: string; effectiveEnd?: string; ruleType: RiskRuleType; customerLevels: string[] },
): Promise<IApiResponse<{ valid: boolean; message?: string }>> {
  return post<{ valid: boolean; message?: string }>('/api/risk-rules/check-period', data)
}

export function createRiskRule(data: IRiskRuleCreateData): Promise<IApiResponse<IRiskRule>> {
  return post<IRiskRule>('/api/risk-rules', data)
}

export function updateRiskRule(id: number, data: IRiskRuleUpdateData): Promise<IApiResponse<IRiskRule>> {
  return put<IRiskRule>(`/api/risk-rules/${id}`, data)
}

export function enableRiskRule(id: number): Promise<IApiResponse<IRiskRule>> {
  return post<IRiskRule>(`/api/risk-rules/${id}/enable`)
}

export function disableRiskRule(id: number): Promise<IApiResponse<IRiskRule>> {
  return post<IRiskRule>(`/api/risk-rules/${id}/disable`)
}

export function resetRiskRule(id: number): Promise<IApiResponse<IRiskRule>> {
  return post<IRiskRule>(`/api/risk-rules/${id}/reset`)
}

export function batchEnableRiskRules(ids: number[]): Promise<IApiResponse<IBatchOperationResult>> {
  return post<IBatchOperationResult>('/api/risk-rules/batch-enable', { ids })
}

export function batchDisableRiskRules(ids: number[]): Promise<IApiResponse<IBatchOperationResult>> {
  return post<IBatchOperationResult>('/api/risk-rules/batch-disable', { ids })
}

export function batchResetRiskRules(ids: number[]): Promise<IApiResponse<IBatchOperationResult>> {
  return post<IBatchOperationResult>('/api/risk-rules/batch-reset', { ids })
}

export function getRiskRuleHistory(id: number, days?: number): Promise<IApiResponse<IRiskRuleHistoryResult>> {
  return get<IRiskRuleHistoryResult>(`/api/risk-rules/${id}/history`, days ? { days } : {})
}

export function getAllRiskRuleHistory(params: { page: number; pageSize: number }): Promise<IApiResponse<IRiskRuleHistoryResult>> {
  return get<IRiskRuleHistoryResult>('/api/risk-rules/history', params)
}

export function matchMarketScenarios(
  params: { marketVolatility: number; sector?: string; tradingVolume?: number },
): Promise<IApiResponse<IRiskRuleScenarioMatch[]>> {
  return post<IRiskRuleScenarioMatch[]>('/api/risk-rules/match-scenarios', params)
}

export function activateScheduledRules(): Promise<IApiResponse<{ activatedCount: number }>> {
  return post<{ activatedCount: number }>('/api/risk-rules/activate-scheduled')
}

export function syncCustomerRiskControls(ruleIds?: number[]): Promise<IApiResponse<{ syncedCustomerCount: number; ruleCount: number }>> {
  return post<{ syncedCustomerCount: number; ruleCount: number }>('/api/risk-rules/sync-controls', { ruleIds })
}

export function deleteRiskRule(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/risk-rules/${id}`)
}
