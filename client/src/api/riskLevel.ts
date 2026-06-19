import { get, post, put } from '@utils/request'
import type {
  IApiResponse,
  IPaginatedData,
  ICustomerRiskProfile,
  ICustomerRiskListParams,
  IRiskLevelChangeRecord,
  IRiskLevelHistoryParams,
  IRiskLevelStats,
  IRiskLevelUpdateData,
  IBatchLevelUpdateParams,
  IBatchLevelUpdatePreview,
  IBatchLevelUpdateResult,
  IRiskAssessmentCreateData,
  IRiskAssessmentResult,
  IRiskLevelStandard,
} from '@/types/api'
import { CustomerRiskLevel } from '@/enums'

export function getCustomerRiskList(
  params: ICustomerRiskListParams,
): Promise<IApiResponse<IPaginatedData<ICustomerRiskProfile>>> {
  return get<IPaginatedData<ICustomerRiskProfile>>('/api/risk-level/customers', params)
}

export function getCustomerRiskById(id: number): Promise<IApiResponse<ICustomerRiskProfile>> {
  return get<ICustomerRiskProfile>(`/api/risk-level/customers/${id}`)
}

export function getCustomerRiskByCustomerId(customerId: number): Promise<IApiResponse<ICustomerRiskProfile>> {
  return get<ICustomerRiskProfile>(`/api/risk-level/customers/by-customer/${customerId}`)
}

export function checkDataIntegrity(customerId: number): Promise<IApiResponse<{
  canAssess: boolean
  overallIntegrity: number
  blockers: string[]
  sources: Array<{ source: string; completeness: number; missing: string[] }>
}>> {
  return get(`/api/risk-level/customers/${customerId}/integrity-check`)
}

export function updateCustomerRiskLevel(
  data: IRiskLevelUpdateData,
): Promise<IApiResponse<{ profile: ICustomerRiskProfile; changeRecordId: number; strategySynced: boolean }>> {
  return put(`/api/risk-level/customers/${data.customerId}/level`, data)
}

export function syncCustomerStrategy(customerId: number): Promise<IApiResponse<{
  synced: boolean
  fields: string[]
  updatedAt: string
}>> {
  return post(`/api/risk-level/customers/${customerId}/sync-strategy`)
}

export function getLevelChangeHistory(
  params: IRiskLevelHistoryParams,
): Promise<IApiResponse<IPaginatedData<IRiskLevelChangeRecord>>> {
  return get<IPaginatedData<IRiskLevelChangeRecord>>('/api/risk-level/history', params)
}

export function getCustomerLevelHistory(
  customerId: number,
  page = 1,
  pageSize = 20,
): Promise<IApiResponse<IPaginatedData<IRiskLevelChangeRecord>>> {
  return get<IPaginatedData<IRiskLevelChangeRecord>>(`/api/risk-level/history/customer/${customerId}`, { page, pageSize })
}

export function getRiskLevelStats(
  params?: { startDate?: string; endDate?: string },
): Promise<IApiResponse<IRiskLevelStats>> {
  return get<IRiskLevelStats>('/api/risk-level/stats', params)
}

export function getLevelDistribution(
  params?: { date?: string },
): Promise<IApiResponse<Array<{
  level: CustomerRiskLevel
  count: number
  ratio: number
  avgScore: number
  totalAssets: number
}>>> {
  return get('/api/risk-level/distribution', params)
}

export function previewBatchUpdate(
  params: IBatchLevelUpdateParams,
): Promise<IApiResponse<IBatchLevelUpdatePreview>> {
  return post<IBatchLevelUpdatePreview>('/api/risk-level/batch/preview', params)
}

export function executeBatchUpdate(
  params: IBatchLevelUpdateParams,
): Promise<IApiResponse<IBatchLevelUpdateResult>> {
  return post<IBatchLevelUpdateResult>('/api/risk-level/batch/execute', params)
}

export function createRiskAssessment(
  data: IRiskAssessmentCreateData,
): Promise<IApiResponse<IRiskAssessmentResult>> {
  return post<IRiskAssessmentResult>('/api/risk-level/assessments', data)
}

export function getAssessmentStatus(assessmentId: number): Promise<IApiResponse<{
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  total: number
  processed: number
  resultSummary?: IRiskAssessmentResult
}>> {
  return get(`/api/risk-level/assessments/${assessmentId}/status`)
}

export function validateLevelChange(
  customerId: number,
  targetLevel: CustomerRiskLevel,
  targetScore?: number,
): Promise<IApiResponse<{
  valid: boolean
  complianceScore: number
  violations: Array<{ rule: string; severity: string; suggestion?: string }>
  dataSupport: Array<{ metric: string; evidence: string; weight: number }>
  blockingReasons?: string[]
  autoApproved: boolean
}>> {
  return post('/api/risk-level/validate-change', { customerId, targetLevel, targetScore })
}

export function getLevelStandards(): Promise<IApiResponse<IRiskLevelStandard[]>> {
  return get<IRiskLevelStandard[]>('/api/risk-level/standards')
}

export function getIncidenceStats(): Promise<IApiResponse<Record<CustomerRiskLevel, {
  totalTrades: number
  interceptions: number
  incidenceRate: number
  lossRate: number
  avgLossPerTrade: number
}>>> {
  return get('/api/risk-level/incidence-stats')
}

export function getOptimizationSuggestions(): Promise<IApiResponse<{
  suggestions: Array<{
    id: number
    metricName: string
    currentThreshold: string
    suggestedThreshold: string
    rationale: string
    impactAnalysis: string
    priority: 'high' | 'medium' | 'low'
  }>
  lastUpdated: string
  basedOnDays: number
}>> {
  return get('/api/risk-level/optimization-suggestions')
}

export function exportRiskProfiles(params: ICustomerRiskListParams): Promise<IApiResponse<{
  downloadUrl: string
  fileName: string
  recordCount: number
}>> {
  return get('/api/risk-level/export', params)
}
