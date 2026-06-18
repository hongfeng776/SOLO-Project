import { get, post } from '@utils/request'
import type { PageResult } from '@/types/api'

export interface PreCheckResult {
  followers: { passed: boolean; value: number; required: number; message: string }
  contentVerticality: { passed: boolean; value: number; required: number; message: string }
  complianceRecord: { passed: boolean; value: number; required: number; message: string }
  realNameVerified: { passed: boolean; value: boolean; message: string }
  overallPassed: boolean
}

export interface QualificationApply {
  id: number
  creatorId: number
  applyNo: string
  status: number
  qualificationType: string
  realName: string
  idCard: string
  idCardFront: string
  idCardBack: string
  businessLicense: string
  businessLicenseNo: string
  industryCert: string
  industryCertNo: string
  industryCategory: string
  otherMaterials?: string
  preCheckResult?: string
  preCheckPassed: number
  rejectReason: string
  auditorId?: number
  auditorName: string
  auditTime?: string
  expireTime?: string
  isExpiringSoon: number
  isFake: number
  fakeReason: string
  submitTime?: string
  createTime: string
  updateTime: string
  creator?: {
    id: number
    name: string
    avatar: string
    platform: string
    followers: number
    category: string
    level: number
  }
}

export interface QualificationLog {
  id: number
  applyId: number
  creatorId: number
  logType: string
  operatorId?: number
  operatorName: string
  operatorRole: string
  beforeStatus?: number
  afterStatus?: number
  remark: string
  detail?: string
  ip: string
  createTime: string
}

export interface BenefitConfig {
  id: number
  creatorId: number
  identityStatus: number
  benefits: string
  liveStreamingEnabled: number
  productLinkEnabled: number
  shoppingCartEnabled: number
  brandCooperationEnabled: number
  commissionEnabled: number
  commissionRate: number
  dataAnalyticsEnabled: number
  activityPriorityEnabled: number
  customerServiceEnabled: number
  verifiedBadgeEnabled: number
  flowBoostEnabled: number
  flowBoostValue: number
  qualificationExpireTime?: string
  createTime: string
  updateTime: string
  creator?: {
    id: number
    name: string
    avatar: string
    platform: string
  }
}

export interface QualificationStats {
  total: number
  pending: number
  underReview: number
  approved: number
  rejected: number
  expired: number
  expiringSoon: number
  fakeCount: number
}

export interface FakeCheckResult {
  isFake: boolean
  reason: string
}

export const getQualificationList = (params: Record<string, unknown>): Promise<PageResult<QualificationApply>> => {
  return get<PageResult<QualificationApply>>('/creator-qualification', params)
}

export const getQualificationDetail = (id: number): Promise<QualificationApply> => {
  return get<QualificationApply>(`/creator-qualification/${id}`)
}

export const getQualificationLogs = (id: number): Promise<QualificationLog[]> => {
  return get<QualificationLog[]>(`/creator-qualification/${id}/logs`)
}

export const preCheckQualification = (creatorId: number): Promise<PreCheckResult> => {
  return post<PreCheckResult>('/creator-qualification/pre-check', { creatorId })
}

export const submitQualification = (data: Record<string, unknown>): Promise<{ id: number; applyNo: string; preCheckPassed: boolean; preCheckResult: PreCheckResult }> => {
  return post<{ id: number; applyNo: string; preCheckPassed: boolean; preCheckResult: PreCheckResult }>('/creator-qualification', data)
}

export const auditQualification = (id: number, status: number, rejectReason?: string): Promise<{ id: number }> => {
  return post<{ id: number }>(`/creator-qualification/${id}/audit`, { status, rejectReason })
}

export const batchAuditQualification = (ids: number[], status: number, rejectReason?: string): Promise<{ successCount: number; totalCount: number }> => {
  return post<{ successCount: number; totalCount: number }>('/creator-qualification/batch-audit', { ids, status, rejectReason })
}

export const checkFakeQualification = (idCard: string, businessLicenseNo?: string): Promise<FakeCheckResult> => {
  return post<FakeCheckResult>('/creator-qualification/check-fake', { idCard, businessLicenseNo })
}

export const getExpiringSoon = (days?: number): Promise<{ list: QualificationApply[]; total: number; days: number }> => {
  return get<{ list: QualificationApply[]; total: number; days: number }>('/creator-qualification/expiring-soon', { days })
}

export const getQualificationStats = (): Promise<QualificationStats> => {
  return get<QualificationStats>('/creator-qualification/stats')
}

export const getApplyByCreator = (creatorId: number): Promise<QualificationApply[]> => {
  return get<QualificationApply[]>(`/creator-qualification/creator/${creatorId}`)
}

export const getTraceLogs = (creatorId: number): Promise<QualificationLog[]> => {
  return get<QualificationLog[]>(`/creator-qualification/creator/${creatorId}/trace`)
}

export const getBenefitConfig = (creatorId: number): Promise<BenefitConfig> => {
  return get<BenefitConfig>(`/creator-qualification/creator/${creatorId}/benefits`)
}
