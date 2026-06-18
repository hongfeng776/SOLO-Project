import { get, post, put } from '@/utils/axios'
import type { PageParams, PageResult } from '@/types'

export interface LevelRuleItem {
  id?: string
  level: string
  levelName?: string
  minMonthlyAmount: number
  minMonthlyOrders: number
  minActiveDays: number
  minReputationScore: number
  commissionRate?: number
  maxChannels?: number
  canUseCoupon?: boolean
  canUseCashback?: boolean
  minOrderAmount?: number
  dailyWithdrawLimit?: number
  canUsePremiumMaterial?: boolean
  canUseAdvancedAnalytics?: boolean
}

export interface ThresholdValidateResult {
  valid: boolean
  failingFields: {
    field: string
    label: string
    current: number
    required: number
    gap: number
  }[]
}

export interface AdjustRequestItem {
  id: string
  promoterId: string
  applicantId?: string
  applicantName?: string
  fromLevel: string
  toLevel: string
  adjustReason?: string
  meetsThreshold?: boolean
  approveStatus: number
  approverId?: string
  approverName?: string
  approveRemark?: string
  approvedAt?: string
  createdAt?: string
  metricsSnapshot?: any
}

export interface AdjustRequestSubmit {
  promoterId: string
  targetLevel: string
  adjustReason?: string
}

export interface AdjustReviewSubmit {
  approved: boolean
  approveRemark?: string
}

export interface BatchReEvaluateResult {
  total: number
  regraded: number
  skipped: number
  failed: number
  details: {
    promoterId: string
    name: string
    code: string
    originalLevel: string
    newLevel: string
    changed: boolean
    metrics: any
    reason?: string
  }[]
}

export type BatchResetResult = BatchReEvaluateResult

export interface LevelChangeLogItem {
  id: string
  promoterId: string
  changeSource: string
  changeSourceLabel?: string
  fromLevel: string
  toLevel: string
  operatorId?: string
  operatorName?: string
  metricsAtChange?: any
  meetsThreshold: boolean
  adjustRequestId?: string
  changeReason?: string
  complianceCheck?: any
  anomalyFlagged: boolean
  anomalyReason?: string
  iterationCount: number
  createdAt: string
}

export interface IterationStats {
  distribution: Record<string, number>
  totalChangeEvents: number
  totalChanges: number
  avgIterationsPerPromoter: number
  maxIterationPromoter?: {
    id: string
    count: number
  }
  anomaliesCount: number
  totalPromoters: number
}

export function getLevelRules(): Promise<LevelRuleItem[]> {
  return get<LevelRuleItem[]>('/promoter-level/rules')
}

export function saveLevelRule(data: LevelRuleItem): Promise<LevelRuleItem> {
  return put<LevelRuleItem>('/promoter-level/rules', data as any)
}

export function validateLevelThreshold(level: string, metrics: any): Promise<ThresholdValidateResult> {
  return post<ThresholdValidateResult>(`/promoter-level/validate/${level}`, metrics)
}

export function requestManualAdjust(data: AdjustRequestSubmit): Promise<any> {
  return post<any>('/promoter-level/adjust/request', data as any)
}

export function reviewAdjustRequest(id: string, data: AdjustReviewSubmit): Promise<null> {
  return put<null>(`/promoter-level/adjust/${id}/review`, data as any)
}

export function getAdjustRequests(params: any & PageParams): Promise<PageResult<AdjustRequestItem>> {
  return get<PageResult<AdjustRequestItem>>('/promoter-level/adjust/requests', params)
}

export function batchReEvaluateLevels(): Promise<BatchReEvaluateResult> {
  return post<BatchReEvaluateResult>('/promoter-level/batch/re-evaluate')
}

export function batchResetLevels(ids: string[], resetTo: string): Promise<BatchResetResult> {
  return post<BatchResetResult>('/promoter-level/batch/reset', { ids, resetTo } as any)
}

export function getLevelChangeLogs(promoterId: string, params: PageParams): Promise<PageResult<LevelChangeLogItem>> {
  return get<PageResult<LevelChangeLogItem>>(`/promoter-level/changes/${promoterId}`, params)
}

export function getIterationStatistics(params?: { startDate?: string; endDate?: string }): Promise<IterationStats> {
  return get<IterationStats>('/promoter-level/iteration-statistics', params)
}
