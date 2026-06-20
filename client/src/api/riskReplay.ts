import { get, post } from '@utils/request'
import type {
  IApiResponse,
  IPaginatedData,
  IReplayQueryParams,
  IReplayFilterValidation,
  IReplayDashboard,
  IReplayEvent,
  IReplayCoreMetrics,
  IReplayTrendPoint,
  IReplayProcessingChain,
  IReplayDimensionStat,
  IRuleValidityAnalysis,
  IRiskVulnerability,
  IReplayOptimizationSuggestion,
  IReplayExportConfig,
  IReplayExportProgress,
} from '@/types/api'

export function validateReplayFilter(
  params: IReplayQueryParams,
): Promise<IApiResponse<IReplayFilterValidation>> {
  return post<IReplayFilterValidation>('/api/risk-replay/validate-filter', params)
}

export function getReplayDashboard(
  params: IReplayQueryParams,
): Promise<IApiResponse<IReplayDashboard>> {
  return post<IReplayDashboard>('/api/risk-replay/dashboard', params)
}

export function getReplayCoreMetrics(
  params: IReplayQueryParams,
): Promise<IApiResponse<IReplayCoreMetrics>> {
  return post<IReplayCoreMetrics>('/api/risk-replay/core-metrics', params)
}

export function getReplayTrend(
  params: IReplayQueryParams,
): Promise<IApiResponse<IReplayTrendPoint[]>> {
  return post<IReplayTrendPoint[]>('/api/risk-replay/trend', params)
}

export function getReplayEventList(
  params: IReplayQueryParams,
): Promise<IApiResponse<IPaginatedData<IReplayEvent>>> {
  return post<IPaginatedData<IReplayEvent>>('/api/risk-replay/events', params)
}

export function getReplayEventById(id: number): Promise<IApiResponse<IReplayEvent>> {
  return get<IReplayEvent>(`/api/risk-replay/events/${id}`)
}

export function getReplayProcessingChain(
  eventId: number,
): Promise<IApiResponse<IReplayProcessingChain>> {
  return get<IReplayProcessingChain>(`/api/risk-replay/events/${eventId}/processing-chain`)
}

export function getDimensionStats(
  params: IReplayQueryParams,
): Promise<IApiResponse<IReplayDimensionStat[]>> {
  return post<IReplayDimensionStat[]>('/api/risk-replay/dimension-stats', params)
}

export function getRuleValidityAnalysis(
  params: IReplayQueryParams,
): Promise<IApiResponse<IRuleValidityAnalysis[]>> {
  return post<IRuleValidityAnalysis[]>('/api/risk-replay/rule-validity', params)
}

export function getRiskVulnerabilities(
  params: IReplayQueryParams,
): Promise<IApiResponse<IRiskVulnerability[]>> {
  return post<IRiskVulnerability[]>('/api/risk-replay/vulnerabilities', params)
}

export function getOptimizationSuggestions(
  params: IReplayQueryParams,
): Promise<IApiResponse<IReplayOptimizationSuggestion[]>> {
  return post<IReplayOptimizationSuggestion[]>('/api/risk-replay/optimization-suggestions', params)
}

export function createExportTask(
  config: IReplayExportConfig & { query: IReplayQueryParams },
): Promise<IApiResponse<{ taskId: string; estimatedSeconds: number; totalRecords: number }>> {
  return post('/api/risk-replay/export/create-task', config)
}

export function getExportTaskStatus(
  taskId: string,
): Promise<IApiResponse<IReplayExportProgress>> {
  return get<IReplayExportProgress>(`/api/risk-replay/export/status/${taskId}`)
}

export function getExportTaskList(
  page = 1,
  pageSize = 20,
): Promise<IApiResponse<IPaginatedData<IReplayExportProgress>>> {
  return get<IPaginatedData<IReplayExportProgress>>('/api/risk-replay/export/tasks', { page, pageSize })
}

export function cancelExportTask(taskId: string): Promise<IApiResponse<{ cancelled: boolean }>> {
  return post(`/api/risk-replay/export/cancel/${taskId}`)
}

export function replaySingleEvent(eventId: number): Promise<IApiResponse<{
  valid: boolean
  issues: Array<{ type: string; description: string; severity: string; suggestion?: string }>
  chainDuplicateWith: string[]
  dataIntegrity: number
  recommendedActions: string[]
}>> {
  return post(`/api/risk-replay/replay-event/${eventId}`)
}

export function batchReplayValidate(eventIds: number[]): Promise<IApiResponse<{
  total: number
  valid: number
  withIssues: number
  duplicates: number
  issuesAggregated: Record<string, number>
  averageIntegrity: number
  reportUrl?: string
}>> {
  return post('/api/risk-replay/batch-replay-validate', { eventIds })
}

export function getReplayFilterPresets(): Promise<IApiResponse<Array<{
  id: string
  name: string
  description: string
  category: string
  icon?: string
  params: Partial<IReplayQueryParams>
  usageCount: number
  createdBy?: string
  createdAt: string
}>>> {
  return get('/api/risk-replay/filter-presets')
}

export function getAnomalyRecurrenceMap(
  params: IReplayQueryParams,
): Promise<IApiResponse<{
  totalEvents: number
  noRecurrence: number
  minorRecurrence: number
  moderateRecurrence: number
  severeRecurrence: number
  byExceptionType: Record<string, Record<string, number>>
  recurringCustomers: Array<{
    customerId: number
    customerName: string
    account: string
    totalOccurrences: number
    lastOccurredAt: string
    severity: string
  }>
}>> {
  return post('/api/risk-replay/recurrence-map', params)
}
