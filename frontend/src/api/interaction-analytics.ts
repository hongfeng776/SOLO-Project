import { http } from '@/utils/request'
import type {
  PaginationParams,
  PaginationResult,
  InteractionStatItem,
  InteractionTrendItem,
  CategoryComparisonItem,
  ExportReportParams,
  ExportReportResult,
  ScreenLowInteractionParams,
  ScreenLowInteractionResult,
  InteractionTraceResult,
  DuplicateStatCheckResult,
  ConsistencyValidateResult,
  InteractionAnalyticsQueryParams,
} from '@/types'

export const getInteractionStatsApi = (params: InteractionAnalyticsQueryParams): Promise<PaginationResult<InteractionStatItem>> => {
  return http.get<PaginationResult<InteractionStatItem>>('/api/v1/interaction-analytics', params)
}

export const getInteractionTrendApi = (params: {
  contentCategory?: number | null
  startDate?: string | null
  endDate?: string | null
  interactionTypes?: string | null
}): Promise<InteractionTrendItem[]> => {
  return http.get<InteractionTrendItem[]>('/api/v1/interaction-analytics/trend', params)
}

export const getCategoryComparisonApi = (params: {
  contentCategories?: string | null
  startDate?: string | null
  endDate?: string | null
}): Promise<CategoryComparisonItem[]> => {
  return http.get<CategoryComparisonItem[]>('/api/v1/interaction-analytics/category-comparison', params)
}

export const batchExportReportApi = (data: ExportReportParams): Promise<ExportReportResult> => {
  return http.post<ExportReportResult>('/api/v1/interaction-analytics/export', data)
}

export const batchScreenLowInteractionApi = (data: ScreenLowInteractionParams): Promise<ScreenLowInteractionResult> => {
  return http.post<ScreenLowInteractionResult>('/api/v1/interaction-analytics/screen-low', data)
}

export const traceInteractionStatsApi = (params: {
  statBatch?: string | null
  contentId?: number | null
  startDate?: string | null
  endDate?: string | null
}): Promise<InteractionTraceResult> => {
  return http.get<InteractionTraceResult>('/api/v1/interaction-analytics/trace', params)
}

export const checkDuplicateStatApi = (params: {
  statBatch?: string | null
  contentId?: number | null
  statDate?: string | null
}): Promise<DuplicateStatCheckResult> => {
  return http.get<DuplicateStatCheckResult>('/api/v1/interaction-analytics/check-duplicate', params)
}

export const validateInteractionConsistencyApi = (params: {
  contentId?: number | null
  statDate?: string | null
}): Promise<ConsistencyValidateResult> => {
  return http.get<ConsistencyValidateResult>('/api/v1/interaction-analytics/validate-consistency', params)
}
