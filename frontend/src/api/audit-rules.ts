import { http } from '@/utils/request'
import type {
  AuditRule,
  AuditRuleListItem,
  AuditRuleCreateForm,
  AuditRuleEditForm,
  RuleConflictCheckResult,
  RuleConsistencyCheckResult,
  AuditRuleTraceResult,
  AuditRuleModifyRecord,
  BatchRuleActionParams,
  BatchRuleActionResult,
  PaginationParams,
  PaginationResult,
} from '@/types'

export const getAuditRuleListApi = (
  params: PaginationParams & {
    ruleType?: string
    ruleCategory?: string
    ruleStatus?: number
    applicableCategory?: string
    keyword?: string
    isCoreDefault?: boolean
    startDate?: string
    endDate?: string
  }
): Promise<PaginationResult<AuditRuleListItem>> => {
  return http.get<PaginationResult<AuditRuleListItem>>('/api/v1/audit-rules', params)
}

export const getAuditRuleDetailApi = (id: number): Promise<AuditRule> => {
  return http.get<AuditRule>(`/api/v1/audit-rules/${id}`)
}

export const createAuditRuleApi = (data: AuditRuleCreateForm): Promise<AuditRule> => {
  return http.post<AuditRule>('/api/v1/audit-rules', data)
}

export const updateAuditRuleApi = (
  id: number,
  data: AuditRuleEditForm
): Promise<{ rule: AuditRule; newEffectBatch?: string }> => {
  return http.put(`/api/v1/audit-rules/${id}`, data)
}

export const enableAuditRuleApi = (
  id: number,
  options?: { resetEffectiveTime?: boolean }
): Promise<{ success: boolean; lastEnabledAt?: string; effectBatch?: string }> => {
  return http.post(`/api/v1/audit-rules/${id}/enable`, options || {})
}

export const disableAuditRuleApi = (id: number): Promise<{ success: boolean; disabledAt?: string }> => {
  return http.post(`/api/v1/audit-rules/${id}/disable`)
}

export const deleteAuditRuleApi = (id: number): Promise<{ success: boolean }> => {
  return http.delete(`/api/v1/audit-rules/${id}`)
}

export const checkRuleConflictsApi = (
  params: Partial<AuditRuleCreateForm> & { excludeRuleId?: number }
): Promise<RuleConflictCheckResult> => {
  return http.post('/api/v1/audit-rules/conflicts/check', params)
}

export const checkRuleConsistencyApi = (
  ruleType: string,
  category?: string
): Promise<RuleConsistencyCheckResult> => {
  return http.get<RuleConsistencyCheckResult>('/api/v1/audit-rules/consistency/check', { ruleType, category })
}

export const getRuleTraceApi = (ruleCode: string): Promise<AuditRuleTraceResult> => {
  return http.get<AuditRuleTraceResult>(`/api/v1/audit-rules/trace/${ruleCode}`)
}

export const getRuleModifyHistoryApi = (
  ruleId: number,
  page = 1,
  pageSize = 20
): Promise<PaginationResult<AuditRuleModifyRecord>> => {
  return http.get<PaginationResult<AuditRuleModifyRecord>>(
    `/api/v1/audit-rules/${ruleId}/history`,
    { page, pageSize }
  )
}

export const batchRuleActionApi = (
  params: BatchRuleActionParams
): Promise<BatchRuleActionResult> => {
  return http.post('/api/v1/audit-rules/batch-action', params)
}

export const syncRuleToAllCategoriesApi = (
  ruleId: number,
  mode: 'copy' | 'merge' = 'copy'
): Promise<{ newRules: AuditRule[]; skippedCategories: string[] }> => {
  return http.post(`/api/v1/audit-rules/${ruleId}/sync`, { mode })
}

export const getRuleDynamicFieldsApi = (
  ruleType: string,
  ruleCategory: string
): Promise<{
  triggerConditions: Array<{ key: string; label: string; fieldType: string; options?: any[]; unit?: string }>
  actions: Array<{ key: string; label: string; defaultParams: Record<string, any> }>
  ruleParams: Array<{ key: string; label: string; fieldType: string; options?: any[]; defaultValue?: any }>
}> => {
  return http.get('/api/v1/audit-rules/dynamic-fields/meta', { ruleType, ruleCategory })
}

export const exportAuditRulesApi = (ruleIds: number[]): Promise<{
  exportId: string
  fileName: string
  count: number
  downloadUrl?: string
}> => {
  return http.post('/api/v1/audit-rules/export', { ruleIds })
}
