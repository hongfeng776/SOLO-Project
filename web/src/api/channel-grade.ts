import { get, post, put } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity } from '@/types'

export type ChannelLevel = 'STAR' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'

export type ChannelLevelChangeSource = 'auto_evaluate' | 'manual_adjust' | 'batch_adjust' | 'rule_change'

export type ChannelLevelAdjustStatus = 0 | 1 | -1

export interface ChannelGradeThreshold {
  minMonthlyAmount: number
  minMonthlyOrders: number
  minCooperationMonths: number
  minFulfillmentRate: number
  minPromotionScore: number
}

export interface ChannelGradeBenefits {
  commissionRateBonus: number
  resourceSupportLevel: number
  canExclusiveActivity: boolean
  canCustomSettle: boolean
  prioritySupport: boolean
  dedicatedManager: boolean
}

export interface ChannelGradeRule extends BaseEntity {
  level: ChannelLevel
  levelName?: string
  minMonthlyAmount: number
  minMonthlyOrders: number
  minCooperationMonths: number
  minFulfillmentRate: number
  minPromotionScore: number
  commissionRateBonus?: number
  resourceSupportLevel?: number
  canExclusiveActivity?: boolean
  canCustomSettle?: boolean
  prioritySupport?: boolean
  dedicatedManager?: boolean
  effectiveFrom?: string
  effectiveTo?: string
  createdBy?: string
  updatedBy?: string
  remark?: string
}

export interface ChannelGradeAdjustRequestItem extends BaseEntity {
  channelId: string
  applicantId?: string
  applicantName?: string
  fromLevel?: ChannelLevel
  toLevel?: ChannelLevel
  adjustReason: string
  metricsSnapshot?: any
  meetsThreshold?: boolean
  approveStatus: ChannelLevelAdjustStatus
  approverId?: string
  approverName?: string
  approveRemark?: string
  approvedAt?: string
  syncedToFrontend?: boolean
}

export interface ChannelGradeChangeLogItem extends BaseEntity {
  channelId: string
  changeSource?: ChannelLevelChangeSource
  fromLevel?: ChannelLevel
  toLevel?: ChannelLevel
  operatorId?: string
  operatorName?: string
  metricsAtChange?: any
  meetsThreshold?: boolean
  adjustRequestId?: string
  changeReason?: string
  complianceCheck?: any
  anomalyFlagged?: boolean
  anomalyReason?: string
  iterationCount?: number
}

export interface ThresholdValidationResult {
  valid: boolean
  failingFields: Array<{
    field: string
    label: string
    current: number
    required: number
    gap: number
  }>
}

export interface RuleValidationResult {
  valid: boolean
  conflicts: Array<{
    field: string
    message: string
  }>
}

export interface BatchGradeResult {
  total: number
  regraded: number
  skipped: number
  failed: number
  details: Array<{
    channelId: string
    name: string
    code: string
    originalLevel: string
    newLevel: string
    changed: boolean
    metrics: any
    reason?: string
  }>
}

export interface GradeStatistics {
  distribution: Record<string, number>
  totalChangeEvents: number
  totalChannels: number
  avgIterations: number
  anomaliesCount: number
}

export function getChannelGradeRules(): Promise<ChannelGradeRule[]> {
  return get<ChannelGradeRule[]>('/channel-grades/rules')
}

export function saveChannelGradeRule(data: Partial<ChannelGradeRule>): Promise<ChannelGradeRule> {
  return put<ChannelGradeRule>('/channel-grades/rules', data)
}

export function validateRuleParams(data: Partial<ChannelGradeRule>): Promise<RuleValidationResult> {
  return post<RuleValidationResult>('/channel-grades/validate-rule', data)
}

export function validateChannelThresholds(level: string, metrics: any): Promise<ThresholdValidationResult> {
  return post<ThresholdValidationResult>(`/channel-grades/validate/${level}`, metrics)
}

export function requestManualAdjust(data: {
  channelId: string
  targetLevel: ChannelLevel
  adjustReason?: string
}): Promise<any> {
  return post('/channel-grades/adjust-request', data)
}

export function reviewAdjustRequest(id: string, data: {
  approved: boolean
  approveRemark?: string
}): Promise<null> {
  return put<null>(`/channel-grades/adjust-request/${id}/review`, data)
}

export function getAdjustRequests(params: PageParams & {
  channelId?: string
  approveStatus?: ChannelLevelAdjustStatus
  applicantId?: string
}): Promise<PageResult<ChannelGradeAdjustRequestItem>> {
  return get<PageResult<ChannelGradeAdjustRequestItem>>('/channel-grades/adjust-requests', params)
}

export function batchAdjustLevels(data: {
  ids: Array<string | number>
  targetLevel: ChannelLevel
}): Promise<BatchGradeResult> {
  return post<BatchGradeResult>('/channel-grades/batch-level', data)
}

export function batchAdjustResources(data: {
  ids: Array<string | number>
  resourceLevel: number
}): Promise<BatchGradeResult> {
  return post<BatchGradeResult>('/channel-grades/batch-resource', data)
}

export function getChannelGradeChangeLogs(params: PageParams & {
  channelId: string
}): Promise<PageResult<ChannelGradeChangeLogItem>> {
  return get<PageResult<ChannelGradeChangeLogItem>>(`/channel-grades/${params.channelId}/change-logs`, params)
}

export function getChannelGradeStatistics(): Promise<GradeStatistics> {
  return get<GradeStatistics>('/channel-grades/statistics')
}
