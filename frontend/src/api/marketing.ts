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
  CampaignQueryParams,
  AudiencePreview,
  AudiencePurposeConfig,
  AudienceLogPage,
  AudienceRiskStats,
  BatchAudienceResult,
  BatchExcludeResult,
  UserEligibilityResult,
  EffectStatisticsResult,
  EffectEvaluation,
  FunnelResult,
  FraudPageResult,
  ExportConfig,
  ExportReportResult,
  CompareResult,
  InefficientMarkResult,
  TemplateToggleResult,
  PreCheckResult,
  SubmitRedemptionResult,
  ManualReviewResult,
  BatchReviewResult,
  RedemptionListResult,
  RedemptionStats,
  TraceResult,
  ViolationPageResult,
  ComplianceOverviewResult,
  RedemptionConfigResult
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

export const getAudienceConfigApi = () =>
  request.get<{
    userTags: { value: string; label: string; color: string }[];
    excludeTags: { value: string; label: string; color: string }[];
    activityLevels: { value: number; label: string }[];
    consumptionLevels: { value: number; label: string }[];
    userLevels: { value: number; label: string }[];
    audiencePurposes: AudiencePurposeConfig[];
  }>('/marketing/audience/config')

export const applyAudienceStrategyApi = (purpose: number, data?: Partial<MarketingCampaign>) =>
  request.post<MarketingCampaign>(`/marketing/audience/strategy/${purpose}`, data || {})

export const previewAudienceApi = (data: Partial<MarketingCampaign>) =>
  request.post<AudiencePreview>('/marketing/audience/preview', data)

export const verifyUserEligibilityApi = (data: { campaignId: number; userId?: number; phone?: string }) =>
  request.post<UserEligibilityResult>('/marketing/audience/verify', data)

export const batchImportAudienceApi = (id: number, data: { userIds?: number[]; phones?: string[]; tagSource?: string }) =>
  request.post<BatchAudienceResult>(`/marketing/audience/${id}/import`, data)

export const batchExcludeAudienceApi = (id: number, data: { userIds?: number[]; phones?: string[]; reason?: string }) =>
  request.post<BatchExcludeResult>(`/marketing/audience/${id}/exclude`, data)

export const batchUpdateAudienceTagsApi = (id: number, data: { addTags?: string[]; removeTags?: string[]; scope?: string }) =>
  request.post<{ currentTags: string[]; addTags: string[]; removeTags: string[]; affectedCount: number }>(`/marketing/audience/${id}/tags`, data)

export const updateAudienceWeightsApi = (id: number, weightConfig: any) =>
  request.put<MarketingCampaign>(`/marketing/audience/${id}/weights`, { weightConfig })

export const getAudienceLogsApi = (id: number, params?: AuditQueryParams) =>
  request.get<AudienceLogPage>(`/marketing/audience/${id}/logs`, params)

export const getAudienceRiskStatsApi = (params?: { campaignId?: number; startDate?: string; endDate?: string }) =>
  request.get<AudienceRiskStats>('/marketing/audience-risk-stats', params)

export const getEffectDetailApi = (id: number, params?: { force?: number }) =>
  request.get<EffectStatisticsResult>(`/marketing/effect/${id}`, params)

export const evaluateCampaignEffectApi = (id: number) =>
  request.post<EffectEvaluation>(`/marketing/effect/evaluate/${id}`)

export const batchEvaluateApi = (ids: number[]) =>
  request.post<EffectEvaluation[]>('/marketing/effect/batch-evaluate', { ids })

export const getEffectFunnelApi = (id: number) =>
  request.get<FunnelResult>(`/marketing/effect/funnel/${id}`)

export const getFraudInterceptApi = (id: number, params?: { page?: number; pageSize?: number }) =>
  request.get<FraudPageResult>(`/marketing/effect/fraud/${id}`, params)

export const getExportConfigApi = () =>
  request.get<ExportConfig>('/marketing/effect/export-config')

export const batchExportReportsApi = (data: {
  ids: number[];
  fields?: string[];
  maskSensitive?: boolean;
  sortBy?: string;
  sortOrder?: string;
}) =>
  request.post<ExportReportResult>('/marketing/effect/batch-export', data)

export const batchCompareCampaignsApi = (ids: number[]) =>
  request.post<CompareResult>('/marketing/effect/batch-compare', { ids })

export const batchMarkInefficientApi = (ids: number[]) =>
  request.post<InefficientMarkResult>('/marketing/effect/batch-mark-inefficient', { ids })

export const toggleTemplateApi = (id: number, data: { isTemplate: boolean; templateTags?: string[] }) =>
  request.put<TemplateToggleResult>(`/marketing/effect/${id}/template`, data)

export const getRedemptionConfigApi = () =>
  request.get<RedemptionConfigResult>('/marketing/redemption/config')

export const preCheckRedemptionApi = (campaignId: number, data: Record<string, any>) =>
  request.post<PreCheckResult>(`/marketing/redemption/pre-check/${campaignId}`, data)

export const submitRedemptionApi = (campaignId: number, data: Record<string, any>) =>
  request.post<SubmitRedemptionResult>(`/marketing/redemption/submit/${campaignId}`, data)

export const manualReviewRedemptionApi = (recordId: number, data: { action: string; remark?: string }) =>
  request.post<ManualReviewResult>(`/marketing/redemption/review/${recordId}`, data)

export const batchManualReviewApi = (data: { ids: number[]; action: string; remark?: string }) =>
  request.post<BatchReviewResult>('/marketing/redemption/batch-review', data)

export const getRedemptionListApi = (campaignId: number, params?: Record<string, any>) =>
  request.get<RedemptionListResult>(`/marketing/redemption/list/${campaignId}`, params)

export const getRedemptionStatsApi = (campaignId: number) =>
  request.get<RedemptionStats>(`/marketing/redemption/stats/${campaignId}`)

export const revokeRedemptionApi = (recordId: number, data: { reason: string }) =>
  request.put(`/marketing/redemption/revoke/${recordId}`, data)

export const getRedemptionTraceApi = (recordId: number) =>
  request.get<TraceResult>(`/marketing/redemption/trace/${recordId}`)

export const getViolationListApi = (params?: Record<string, any>) =>
  request.get<ViolationPageResult>('/marketing/redemption/violations', params)

export const batchRejectViolationsApi = (data: { ids: number[]; reason?: string }) =>
  request.post<BatchReviewResult>('/marketing/redemption/batch-reject', data)

export const batchReviewPendingApi = (campaignId: number, data: { action: string; scene?: number; startDate?: string; endDate?: string }) =>
  request.post<BatchReviewResult>(`/marketing/redemption/batch-pending/${campaignId}`, data)

export const getComplianceOverviewApi = (campaignId: number) =>
  request.get<ComplianceOverviewResult>(`/marketing/redemption/compliance/${campaignId}`)
