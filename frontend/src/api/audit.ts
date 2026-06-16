import { get, post, put } from '@utils/request'
import type { PageParams, PageResult } from '@types'
import type { AuditRecord, AuditRule } from '@types/business'

export interface AuditQueryParams extends PageParams {
  businessType?: number
  status?: number
  submitterName?: string
  startTime?: string
  endTime?: string
}

export interface AuditRuleQueryParams extends PageParams {
  name?: string
  code?: string
  businessType?: number
  status?: number
}

export interface AuditActionParams {
  id: number
  status: number
  remark: string
}

export function getPendingAuditListApi(params: AuditQueryParams) {
  return get<PageResult<AuditRecord>>('/audit/pending/list', params)
}

export function getAuditHistoryListApi(params: AuditQueryParams) {
  return get<PageResult<AuditRecord>>('/audit/history/list', params)
}

export function getAuditDetailApi(id: number) {
  return get<AuditRecord>(`/audit/${id}`)
}

export function auditApproveApi(data: AuditActionParams) {
  return put<void>(`/audit/${data.id}/approve`, data)
}

export function auditRejectApi(data: AuditActionParams) {
  return put<void>(`/audit/${data.id}/reject`, data)
}

export function batchAuditApi(ids: number[], status: number, remark: string) {
  return post<void>('/audit/batch', { ids, status, remark })
}

export function getAuditRuleListApi(params: AuditRuleQueryParams) {
  return get<PageResult<AuditRule>>('/audit/rule/list', params)
}

export function getAuditRuleDetailApi(id: number) {
  return get<AuditRule>(`/audit/rule/${id}`)
}

export function createAuditRuleApi(data: Partial<AuditRule>) {
  return post<AuditRule>('/audit/rule', data)
}

export function updateAuditRuleApi(data: Partial<AuditRule>) {
  return put<AuditRule>(`/audit/rule/${data.id}`, data)
}

export function deleteAuditRuleApi(id: number) {
  return put<void>(`/audit/rule/${id}/delete`)
}
