import { get, post } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity } from '@/types'

export type ChannelAuditStage = 0 | 1 | 2 | 3 | 4 | -1
export type ChannelAuditStatus =
  | 'pending'
  | 'data_auditing'
  | 'data_passed'
  | 'qualification_auditing'
  | 'qualification_passed'
  | 'permission_auditing'
  | 'passed'
  | 'rejected'
  | 'blacklisted'
  | 'locked'

export type ChannelPriority = 0 | 1 | 2
export type ChannelRejectIssueType =
  | 'missing_docs'
  | 'expired_qualification'
  | 'false_info'
  | 'invalid_contact'
  | 'duplicate_subject'
  | 'blacklist_match'
  | 'credit_abnormal'
  | 'other'

export interface ChannelAuditItem extends BaseEntity {
  channelId?: string
  name: string
  code?: string
  type?: string
  companyName?: string
  creditCode?: string
  legalPerson?: string
  legalPersonIdCard?: string
  contactName: string
  contactPhone: string
  contactEmail?: string
  address?: string
  businessLicenseImg?: string
  idCardFrontImg?: string
  idCardBackImg?: string
  otherQualificationImgs?: any[]
  commissionRate?: number
  priority: ChannelPriority
  auditStage: ChannelAuditStage
  auditStatus: ChannelAuditStatus
  isKeyChannel?: boolean
  riskFlagged?: boolean
  riskReason?: string
  applyCount?: number
  lastApplyAt?: string
  dataHash?: string
  rejectIssueTypes?: ChannelRejectIssueType[]
  rejectCustomRemark?: string
  rejectedAt?: string
  lockUntil?: string
  lockRemainingHours?: number
  isLocked?: boolean
  dataAuditorId?: string
  dataAuditAt?: string
  dataAuditRemark?: string
  qualificationAuditorId?: string
  qualificationAuditAt?: string
  qualificationAuditRemark?: string
  permissionAuditorId?: string
  permissionAuditAt?: string
  permissionAuditRemark?: string
  activatedAt?: string
  creditCheckResult?: any
  blacklistMatched?: boolean
  blacklistItems?: any[]
  remark?: string
  auditLogs?: any[]
  qualifications?: any[]
  rejectRecords?: any[]
  timeline?: any[]
}

export interface ChannelAuditQueryParams extends PageParams {
  keyword?: string
  auditStageList?: ChannelAuditStage[]
  auditStatusList?: ChannelAuditStatus[]
  priority?: ChannelPriority
  riskFlagged?: boolean
  contactPhone?: string
  creditCode?: string
  companyName?: string
  startDate?: string
  endDate?: string
  isKeyChannel?: boolean
}

export interface ChannelApplyData {
  name: string
  type?: string
  companyName?: string
  creditCode?: string
  legalPerson?: string
  legalPersonIdCard?: string
  contactName: string
  contactPhone: string
  contactEmail?: string
  address?: string
  businessLicenseImg?: string
  idCardFrontImg?: string
  idCardBackImg?: string
  otherQualificationImgs?: any[]
  commissionRate?: number
  remark?: string
}

export interface RejectData {
  issueTypes: ChannelRejectIssueType[]
  customRemark?: string
  lockDays?: number
}

export interface BatchAuditResult {
  total: number
  success: number
  failed: number
  skipped: number
  details: Array<{
    id: string
    name: string
    contactPhone: string
    status: 'success' | 'failed' | 'skipped'
    reason?: string
  }>
}

export interface PreCheckResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  riskFlags: string[]
  blacklistMatched?: { items: any[] }
  lockInfo?: { locked: boolean; lockUntil?: string; remainingHours?: number }
  duplicateInfo?: { fields: string[] }
  creditCheck?: { status: string; score?: number; warnings: string[] }
}

export function preCheckChannelApply(data: ChannelApplyData): Promise<PreCheckResult> {
  return post<PreCheckResult>('/channel-audits/pre-check', data)
}

export function submitChannelApply(data: ChannelApplyData): Promise<ChannelAuditItem> {
  return post<ChannelAuditItem>('/channel-audits/apply', data)
}

export function getChannelAuditList(params: ChannelAuditQueryParams): Promise<PageResult<ChannelAuditItem>> {
  const queryParams: any = { ...params }
  if (params.auditStageList) {
    queryParams.auditStageList = JSON.stringify(params.auditStageList)
  }
  if (params.auditStatusList) {
    queryParams.auditStatusList = JSON.stringify(params.auditStatusList)
  }
  return get<PageResult<ChannelAuditItem>>('/channel-audits', queryParams)
}

export function getChannelAuditDetail(id: string | number): Promise<ChannelAuditItem> {
  return get<ChannelAuditItem>(`/channel-audits/${id}`)
}

export function channelDataPass(id: string | number, remark?: string): Promise<null> {
  return post<null>(`/channel-audits/${id}/data-pass`, { remark })
}

export function channelDataReject(id: string | number, data: RejectData): Promise<null> {
  return post<null>(`/channel-audits/${id}/data-reject`, data)
}

export function channelQualificationPass(id: string | number, remark?: string): Promise<null> {
  return post<null>(`/channel-audits/${id}/qualification-pass`, { remark })
}

export function channelQualificationReject(id: string | number, data: RejectData): Promise<null> {
  return post<null>(`/channel-audits/${id}/qualification-reject`, data)
}

export function channelPermissionPass(id: string | number, remark?: string): Promise<null> {
  return post<null>(`/channel-audits/${id}/permission-pass`, { remark })
}

export function channelPermissionReject(id: string | number, data: RejectData): Promise<null> {
  return post<null>(`/channel-audits/${id}/permission-reject`, data)
}

export function batchChannelDataPass(ids: Array<string | number>): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/channel-audits/batch/data-pass', { ids })
}

export function batchChannelQualificationPass(ids: Array<string | number>): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/channel-audits/batch/qualification-pass', { ids })
}

export function batchChannelPermissionPass(ids: Array<string | number>): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/channel-audits/batch/permission-pass', { ids })
}

export function batchChannelDataReject(ids: Array<string | number>, data: RejectData): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/channel-audits/batch/data-reject', { ids, ...data })
}

export function batchChannelQualificationReject(ids: Array<string | number>, data: RejectData): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/channel-audits/batch/qualification-reject', { ids, ...data })
}

export function batchChannelPermissionReject(ids: Array<string | number>, data: RejectData): Promise<BatchAuditResult> {
  return post<BatchAuditResult>('/channel-audits/batch/permission-reject', { ids, ...data })
}

export function getChannelAuditLogs(params: {
  page: number
  pageSize: number
  channelAuditId?: string | number
  operatorId?: string
  action?: string
  startDate?: string
  endDate?: string
}): Promise<PageResult<any>> {
  return get<PageResult<any>>('/channel-audits/logs', params)
}

export function getChannelAuditStatistics(): Promise<{
  dataReview: number
  qualificationVerify: number
  permissionActivate: number
  pendingTotal: number
  rejected: number
  passed: number
  total: number
  riskFlagged: number
  keyChannels: number
}> {
  return get<any>('/channel-audits/statistics')
}
