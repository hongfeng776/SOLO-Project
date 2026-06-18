import { get, post, put } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  BehaviorLog,
  RiskControlLog,
  PunishmentRecord,
  UserRiskStatus,
  AnomalyDetectResult,
  PunishmentValidation,
  ViolationTrace,
  ReviewReport,
  RiskControlPermission
} from '@/types/business'

export const getBehaviorLogs = (
  params: Record<string, unknown>
): Promise<PageResult<BehaviorLog> & { permission: RiskControlPermission }> => {
  return get<PageResult<BehaviorLog> & { permission: RiskControlPermission }>('/risk-control/behavior-logs', params)
}

export const getRiskControlList = (
  params: Record<string, unknown>
): Promise<PageResult<RiskControlLog> & { permission: RiskControlPermission; stats?: Record<string, number> }> => {
  return get<PageResult<RiskControlLog> & { permission: RiskControlPermission; stats?: Record<string, number> }>('/risk-control/list', params)
}

export const getUserRiskDetail = (
  id: number
): Promise<UserRiskStatus> => {
  return get<UserRiskStatus>(`/risk-control/${id}/detail`)
}

export const detectAnomaly = (
  id: number,
  data?: { behaviorType?: string }
): Promise<AnomalyDetectResult> => {
  return post<AnomalyDetectResult>(`/risk-control/${id}/detect`, data || {})
}

export const interceptBehavior = (
  id: number,
  data: { behaviorType: string; reason: string }
): Promise<{ success: boolean; message: string }> => {
  return post<{ success: boolean; message: string }>(`/risk-control/${id}/intercept`, data)
}

export const getPunishmentList = (
  params: Record<string, unknown>
): Promise<PageResult<PunishmentRecord>> => {
  return get<PageResult<PunishmentRecord>>('/risk-control/punishment/list', params)
}

export const applyPunishment = (
  id: number,
  data: {
    punishmentType: string
    reason: string
    reasonDetail?: string
    duration?: number
  }
): Promise<{ success: boolean; message: string; punishmentId?: number }> => {
  return post<{ success: boolean; message: string; punishmentId?: number }>(`/risk-control/${id}/punish`, data)
}

export const revokePunishment = (
  id: number,
  data: { reason: string }
): Promise<{ success: boolean; message: string }> => {
  return put<{ success: boolean; message: string }>(`/risk-control/${id}/revoke`, data)
}

export const batchHandlePunishment = (
  data: {
    userIds: number[]
    action: 'release_minor' | 'ban_severe'
    reason: string
  }
): Promise<{ total: number; success: number; fail: number; results: Array<{ userId: number; success: boolean; error?: string }> }> => {
  return post('/risk-control/batch/handle', data)
}

export const getViolationTrace = (
  id: number
): Promise<ViolationTrace> => {
  return get<ViolationTrace>(`/risk-control/${id}/trace`)
}

export const validatePunishment = (
  id: number,
  data: { punishmentType: string; violationType: string }
): Promise<PunishmentValidation> => {
  return post<PunishmentValidation>(`/risk-control/${id}/validate`, data)
}

export const generateReviewReport = (
  id: number
): Promise<ReviewReport> => {
  return post<ReviewReport>(`/risk-control/${id}/report`)
}
