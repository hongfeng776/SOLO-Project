import { get, post, put } from '@/utils/axios'
import type { PageParams, PageResult } from '@/types'

export interface RejectRecordItem {
  id: string
  action: string
  stage: string
  operator: string
  reasonCode: string
  reasonLabel: string
  customRemark?: string
  fullRemark: string
  lockUntil?: string
  remainingHours: number
  locked: boolean
  createdAt: string
}

export interface AuditDetailItem {
  id: string
  code: string
  name: string
  nickname?: string
  avatar?: string
  phone?: string
  email?: string
  wechatId?: string
  idCard?: string
  idCardFrontImg?: string
  idCardBackImg?: string
  channelId?: string
  channelName?: string
  level: string
  status: number
  auditStage: number
  auditStatus: string
  firstAuditorId?: string
  firstAuditor?: { id: string; name: string; username: string }
  firstAuditAt?: string
  firstAuditRemark?: string
  secondAuditorId?: string
  secondAuditor?: { id: string; name: string; username: string }
  secondAuditAt?: string
  secondAuditRemark?: string
  rejectReasonCode?: string
  rejectCustomRemark?: string
  rejectedAt?: string
  lockUntil?: string
  applyCount?: number
  lastApplyAt?: string
  riskFlagged: boolean
  riskReason?: string
  rejectRecords: RejectRecordItem[]
  lockRemainingHours: number
  isLocked: boolean
  createdAt: string
  updatedAt: string
}

export interface AuditListItem {
  id: string
  code: string
  name: string
  phone?: string
  idCard?: string
  channelId?: string
  channelName?: string
  level: string
  status: number
  auditStage: number
  auditStatus: string
  riskFlagged: boolean
  riskReason?: string
  firstAuditor?: { id: string; name: string; username: string }
  firstAuditAt?: string
  secondAuditor?: { id: string; name: string; username: string }
  secondAuditAt?: string
  lockUntil?: string
  rejectReasonCode?: string
  lockRemainingHours: number
  applyCount?: number
  createdAt: string
}

export interface AuditQueryParams extends PageParams {
  keyword?: string
  auditStageList?: string
  auditStatusList?: string
  channelId?: string
  level?: string
  phone?: string
  idCard?: string
  riskFlagged?: boolean
  startDate?: string
  endDate?: string
}

export interface PreCheckResult {
  valid: boolean
  errors: string[]
  blacklistMatched?: { items: any[] }
  lockInfo?: { locked: boolean; lockUntil?: string; remainingHours?: number }
  dataIntegrity?: { missingFields: string[] }
  riskFlags?: string[]
}

export interface RejectSubmitData {
  reasonCode: string
  customRemark?: string
  lockDays?: number
}

export interface BatchAuditDetail {
  id: string
  name: string
  phone: string
  status: 'success' | 'failed' | 'skipped'
  reason?: string
}

export interface BatchAuditResult {
  total: number
  success: number
  failed: number
  skipped: number
  details: BatchAuditDetail[]
}

export interface AuditStatistics {
  pendingFirst: number
  pendingSecond: number
  pendingTotal: number
  rejected: number
  passed: number
}

export interface RejectReasonOption {
  code: string
  label: string
}

export interface AuditLogItem {
  id: string
  promoterId: string
  action: string
  actionLabel: string
  fromStage: number
  fromStageLabel: string
  toStage: number
  toStageLabel: string
  fromStatus: string
  fromStatusLabel: string
  toStatus: string
  toStatusLabel: string
  operatorId?: string
  operatorName?: string
  remark?: string
  rejectReasonCode?: string
  rejectCustomRemark?: string
  metadata?: any
  createdAt: string
}

export function preCheckApply(data: any): Promise<PreCheckResult> {
  return post<PreCheckResult>('/promoter-audits/pre-check', data)
}

export function submitApply(data: any): Promise<AuditDetailItem> {
  return post<AuditDetailItem>('/promoter-audits/apply', data)
}

export function getAuditList(params: AuditQueryParams): Promise<PageResult<AuditListItem>> {
  return get<PageResult<AuditListItem>>('/promoter-audits/list', params)
}

export function getAuditDetail(id: string | number): Promise<AuditDetailItem> {
  return get<AuditDetailItem>(`/promoter-audits/${id}`)
}

export function firstAuditPass(id: string | number, remark?: string): Promise<null> {
  return put<null>(`/promoter-audits/${id}/first-pass`, { remark })
}

export function firstAuditReject(id: string | number, data: RejectSubmitData): Promise<null> {
  return put<null>(`/promoter-audits/${id}/first-reject`, data)
}

export function secondAuditPass(id: string | number, remark?: string): Promise<null> {
  return put<null>(`/promoter-audits/${id}/second-pass`, { remark })
}

export function secondAuditReject(id: string | number, data: RejectSubmitData): Promise<null> {
  return put<null>(`/promoter-audits/${id}/second-reject`, data)
}

export function batchFirstPass(ids: (string | number)[]): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/promoter-audits/batch-first-pass', { ids })
}

export function batchSecondPass(ids: (string | number)[]): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/promoter-audits/batch-second-pass', { ids })
}

export function batchFirstReject(ids: (string | number)[], data: RejectSubmitData): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/promoter-audits/batch-first-reject', { ids, ...data })
}

export function batchSecondReject(ids: (string | number)[], data: RejectSubmitData): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/promoter-audits/batch-second-reject', { ids, ...data })
}

export function getAuditStatistics(): Promise<AuditStatistics> {
  return get<AuditStatistics>('/promoter-audits/statistics')
}

export function getRejectReasons(): Promise<RejectReasonOption[]> {
  return get<RejectReasonOption[]>('/promoter-audits/reject-reasons')
}

export function searchAuditLogs(params: PageParams & {
  phone?: string
  idCard?: string
  promoterId?: string
  startDate?: string
  endDate?: string
}): Promise<PageResult<AuditLogItem>> {
  return get<PageResult<AuditLogItem>>('/promoter-audits/logs', params)
}
