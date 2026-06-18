import { get, post, put } from '@/utils/axios'
import type { PageParams, PageResult } from '@/types'

export type RiskRecordItem = {
  id: string
  promoterId: string
  riskLevel: string
  riskType: string
  riskTitle: string
  riskDescription?: string
  riskEvidence?: string[]
  operatorId?: string
  operatorName?: string
  controlStatus: number
  permissionsSnapshot?: any
  expireAt?: string
  isActive: boolean
  createdAt: string
  promoter?: { name: string; code: string; phone: string }
}

export type RiskReleaseItem = {
  id: string
  promoterId: string
  applicantId?: string
  applicantName?: string
  riskRecordId: string
  releaseReason: string
  proofMaterials?: string[]
  rectificationDesc?: string
  abnormalDataCleared: boolean
  verifyStatus: number
  verifierId?: string
  verifierName?: string
  verifyRemark?: string
  verifiedAt?: string
  restoreStage: number
  createdAt: string
}

export type RiskBehaviorItem = {
  id: string
  promoterId: string
  behaviorType: string
  behaviorDesc?: string
  ipAddress?: string
  deviceId?: string
  location?: string
  orderId?: string
  amount?: number
  riskFlagged: boolean
  riskType?: string
  riskScore?: number
  metadata?: any
  createdAt: string
}

export type RiskWarningItem = {
  id: string
  promoterId: string
  warningLevel: string
  warningType: string
  warningTitle: string
  warningDesc?: string
  ruleCode?: string
  riskScore?: number
  isHandled: boolean
  handledBy?: string
  handledAt?: string
  handleRemark?: string
  createdAt: string
}

export type MarkRiskSubmit = {
  promoterId: string
  riskLevel: string
  riskType: string
  riskTitle: string
  riskDescription?: string
  riskEvidence?: string[]
  expireAt?: string
}

export type ReleaseSubmit = {
  promoterId: string
  riskRecordId: string
  releaseReason: string
  proofMaterials?: string[]
  rectificationDesc?: string
}

export type BatchRiskSubmit = {
  ids: string[]
  riskLevel: string
  riskType: string
  riskTitle: string
  riskDescription?: string
  expireAt?: string
}

export type BatchRiskResult = {
  total: number
  success: number
  skipped: number
  failed: number
  details: { id: string; name: string; status: 'success' | 'skipped' | 'failed'; reason?: string }[]
}

export type RiskProfile = {
  riskControlStatus: number
  riskLevel?: string
  riskType?: string
  riskMarkedAt?: string
  riskExpireAt?: string
  permissions?: { canPromote: boolean; canJoinActivity: boolean; canWithdraw: boolean; canLogin: boolean }
  activeRiskRecord?: RiskRecordItem
  recentWarnings: RiskWarningItem[]
  behaviorCount30Days: number
  riskScore: number
}

export function getRiskList(params: any & PageParams): Promise<PageResult<RiskRecordItem>> {
  return get<PageResult<RiskRecordItem>>('/promoter-risk/records', params)
}

export function getRiskDetail(id: string): Promise<RiskRecordItem> {
  return get<RiskRecordItem>(`/promoter-risk/records/${id}`)
}

export function markRisk(data: MarkRiskSubmit): Promise<RiskRecordItem> {
  return post<RiskRecordItem>('/promoter-risk/records', data)
}

export function updateRisk(id: string, data: Partial<MarkRiskSubmit>): Promise<RiskRecordItem> {
  return put<RiskRecordItem>(`/promoter-risk/records/${id}`, data)
}

export function cancelRisk(id: string): Promise<null> {
  return put<null>(`/promoter-risk/records/${id}/cancel`)
}

export function getRiskProfile(promoterId: string): Promise<RiskProfile> {
  return get<RiskProfile>(`/promoter-risk/profile/${promoterId}`)
}

export function getReleaseList(params: any & PageParams): Promise<PageResult<RiskReleaseItem>> {
  return get<PageResult<RiskReleaseItem>>('/promoter-risk/releases', params)
}

export function submitRelease(data: ReleaseSubmit): Promise<RiskReleaseItem> {
  return post<RiskReleaseItem>('/promoter-risk/releases', data)
}

export function reviewRelease(
  id: string,
  data: { passed: boolean; verifyRemark?: string; restoreStage?: number }
): Promise<null> {
  return put<null>(`/promoter-risk/releases/${id}/review`, data)
}

export function batchMarkRisk(data: BatchRiskSubmit): Promise<BatchRiskResult> {
  return post<BatchRiskResult>('/promoter-risk/records/batch', data)
}

export function batchCancelRisk(ids: string[]): Promise<BatchRiskResult> {
  return put<BatchRiskResult>('/promoter-risk/records/batch-cancel', { ids })
}

export function getBehaviorTrace(
  promoterId: string,
  params: any & PageParams
): Promise<PageResult<RiskBehaviorItem>> {
  return get<PageResult<RiskBehaviorItem>>(`/promoter-risk/behavior/${promoterId}`, params)
}

export function getWarningList(params: any & PageParams): Promise<PageResult<RiskWarningItem>> {
  return get<PageResult<RiskWarningItem>>('/promoter-risk/warnings', params)
}

export function handleWarning(id: string, data: { handleRemark: string }): Promise<null> {
  return put<null>(`/promoter-risk/warnings/${id}/handle`, data)
}

export function getRiskStatistics(params?: any): Promise<{
  distribution: any
  totalControlled: number
  pendingReleases: number
  activeWarnings: number
  highFrequencyList: any[]
}> {
  return get<{
    distribution: any
    totalControlled: number
    pendingReleases: number
    activeWarnings: number
    highFrequencyList: any[]
  }>('/promoter-risk/statistics', params)
}
