import { http } from '@/utils/request'
import type {
  PaginationResult,
  PaginationParams,
  SegmentRuleItem,
  SegmentTagItem,
  SegmentStrategyItem,
  SegmentStats,
  SegmentValidateResult,
  SegmentBenefitFit,
  SegmentMatchPreview,
  SegmentValidateMatch,
  SegmentTraceResult,
  ManualAdjustResult,
  SegmentThreshold,
} from '@/types'

export const getSegmentStatsApi = (): Promise<SegmentStats> => {
  return http.get<SegmentStats>('/api/v1/user-segment/stats')
}

// ============ 规则管理 ============
export const getSegmentRuleListApi = (
  params: PaginationParams & { keyword?: string; status?: number; dimension?: string; sortBy?: string; sortOrder?: string }
): Promise<PaginationResult<SegmentRuleItem>> => {
  return http.get<PaginationResult<SegmentRuleItem>>('/api/v1/user-segment/rules', params)
}

export const getSegmentRuleDetailApi = (id: number): Promise<SegmentRuleItem> => {
  return http.get<SegmentRuleItem>(`/api/v1/user-segment/rules/${id}`)
}

export const createSegmentRuleApi = (data: {
  ruleName: string
  ruleCode?: string
  description?: string
  dimension: string
  thresholds: SegmentThreshold[]
  weights?: Record<string, number>
  targetUserType?: number[]
  targetMinLevel?: number
  autoCalcEnabled?: number
  status?: number
  effectiveStartAt?: string
  effectiveEndAt?: string
  priority?: number
  tagTemplate?: Record<string, string[]>
}): Promise<SegmentRuleItem> => {
  return http.post<SegmentRuleItem>('/api/v1/user-segment/rules', data)
}

export const updateSegmentRuleApi = (
  id: number,
  data: Partial<SegmentRuleItem>
): Promise<SegmentRuleItem> => {
  return http.put<SegmentRuleItem>(`/api/v1/user-segment/rules/${id}`, data)
}

export const deleteSegmentRuleApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/user-segment/rules/${id}`)
}

export const updateSegmentRuleStatusApi = (id: number, status: number): Promise<SegmentRuleItem> => {
  return http.patch<SegmentRuleItem>(`/api/v1/user-segment/rules/${id}/status`, { status })
}

export const runSegmentRuleCalcApi = (id: number): Promise<{ total: number; changed: number; operationBatch: string; message?: string }> => {
  return http.post<{ total: number; changed: number; operationBatch: string }>(`/api/v1/user-segment/rules/${id}/run`)
}

export const validateSegmentThresholdsApi = (params: {
  thresholds: SegmentThreshold[]
  weights?: Record<string, number>
}): Promise<SegmentValidateResult> => {
  return http.post<SegmentValidateResult>('/api/v1/user-segment/rules/validate', params)
}

// ============ 用户分层标签 ============
export const getSegmentTagListApi = (
  params: PaginationParams & {
    currentLevel?: number
    ruleId?: number
    userId?: number
    uid?: string
    changeType?: string
  }
): Promise<PaginationResult<SegmentTagItem>> => {
  return http.get<PaginationResult<SegmentTagItem>>('/api/v1/user-segment/tags', params)
}

// ============ 层级调整 ============
export const manualAdjustSegmentApi = (params: {
  userId: number
  toLevel: number
  reason: string
  remark?: string
  expireDays?: number
}): Promise<ManualAdjustResult> => {
  return http.post<ManualAdjustResult>('/api/v1/user-segment/adjust', params)
}

// ============ 策略管理 ============
export const getSegmentStrategyListApi = (
  params: PaginationParams & {
    keyword?: string
    status?: number
    strategyType?: string
    triggerMode?: number
  }
): Promise<PaginationResult<SegmentStrategyItem>> => {
  return http.get<PaginationResult<SegmentStrategyItem>>('/api/v1/user-segment/strategies', params)
}

export const createSegmentStrategyApi = (data: Partial<SegmentStrategyItem>): Promise<SegmentStrategyItem> => {
  return http.post<SegmentStrategyItem>('/api/v1/user-segment/strategies', data)
}

export const getSegmentStrategyPreviewApi = (id: number): Promise<SegmentMatchPreview> => {
  return http.get<SegmentMatchPreview>(`/api/v1/user-segment/strategies/${id}/preview`)
}

export const cancelSegmentStrategyApi = (id: number): Promise<void> => {
  return http.patch<void>(`/api/v1/user-segment/strategies/${id}/cancel`)
}

// ============ 溯源与校验 ============
export const traceSegmentApi = (userId: number): Promise<SegmentTraceResult> => {
  return http.get<SegmentTraceResult>(`/api/v1/user-segment/trace/${userId}`)
}

export const validateSegmentMatchApi = (ruleId: number): Promise<SegmentValidateMatch> => {
  return http.get<SegmentValidateMatch>(`/api/v1/user-segment/validate/${ruleId}`)
}

export const checkSegmentBenefitFitApi = (params: {
  level: number
  benefitConfig: Record<string, any>
}): Promise<SegmentBenefitFit> => {
  return http.post<SegmentBenefitFit>('/api/v1/user-segment/benefit-fit', params)
}
