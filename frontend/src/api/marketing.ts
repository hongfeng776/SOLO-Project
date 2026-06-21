import request from '@/utils/request'
import type {
  MarketingCampaign,
  ValidateResult,
  MarketingAuditLog,
  SceneConfig,
  BatchOperationResult,
  BatchUpdateParams,
  BatchStatusParams,
  BatchCopyParams,
  CampaignStatistics,
  RiskStats,
  AuditQueryParams,
  CampaignQueryParams
} from '@/types/marketing'

export const getMarketingListApi = (params: CampaignQueryParams) =>
  request.get('/marketing', params)

export const getMarketingDetailApi = (id: number) =>
  request.get(`/marketing/${id}`)

export const createMarketingApi = (data: Partial<MarketingCampaign>) =>
  request.post('/marketing', data)

export const updateMarketingApi = (id: number, data: Partial<MarketingCampaign>) =>
  request.put(`/marketing/${id}`, data)

export const deleteMarketingApi = (id: number) =>
  request.delete(`/marketing/${id}`)

export const updateMarketingStatusApi = (id: number, status: number) =>
  request.put(`/marketing/${id}/status`, { status })

export const getMarketingStatisticsApi = (id: number) =>
  request.get<CampaignStatistics>(`/marketing/statistics/${id}`)

export const validateCampaignApi = (data: Partial<MarketingCampaign>, id?: number) => {
  if (id) {
    return request.post<ValidateResult>(`/marketing/validate/${id}`, data)
  }
  return request.post<ValidateResult>('/marketing/validate', data)
}

export const copyCampaignApi = (id: number, data?: { nameSuffix?: string; newCode?: string }) =>
  request.post<MarketingCampaign>(`/marketing/copy/${id}`, data || {})

export const batchCopyCampaignApi = (data: BatchCopyParams) =>
  request.post<BatchOperationResult>('/marketing/batch/copy', data)

export const batchUpdateCampaignApi = (data: BatchUpdateParams) =>
  request.post<BatchOperationResult>('/marketing/batch/update', data)

export const batchUpdateStatusApi = (data: BatchStatusParams) =>
  request.post<BatchOperationResult>('/marketing/batch/status', data)

export const batchUpdateCityTierApi = (data: { ids: number[]; tierConfigs: any }) =>
  request.post<BatchOperationResult>('/marketing/batch/city-tier', data)

export const getMarketingAuditApi = (id: number, params?: AuditQueryParams) =>
  request.get<{ list: MarketingAuditLog[]; total: number }>(`/marketing/audit/${id}`, params)

export const getSceneConfigApi = () =>
  request.get<SceneConfig[]>('/marketing/scene-config')

export const getRiskStatsApi = (params?: { startDate?: string; endDate?: string }) =>
  request.get<RiskStats>('/marketing/risk-stats', params)
