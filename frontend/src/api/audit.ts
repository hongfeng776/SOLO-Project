import request from '@/utils/request'
import type { PageResult, AuditRecord, PageParams } from '@/types'

interface AuditListParams extends PageParams {
  keyword?: string
  auditResult?: string
  resourceType?: string
  auditorId?: number
}

export const getPendingAuditList = (params: PageParams & { resourceType?: string }) => {
  return request.get<PageResult<any>>('/audit/pending', params)
}

export const getAuditRecords = (params: AuditListParams) => {
  return request.get<PageResult<AuditRecord>>('/audit/records', params)
}

export const auditResource = (resourceId: number, data: { result: string; opinion: string; level: number }) => {
  return request.post(`/audit/${resourceId}`, data)
}

export const batchAudit = (ids: number[], data: { result: string; opinion: string; level: number }) => {
  return request.post('/audit/batch', { ids, ...data })
}

export const getAuditStats = () => {
  return request.get<{ totalCount: number; approvedCount: number; rejectedCount: number; todayCount: number }>('/audit/stats')
}

export const getViolationStats = () => {
  return request.get<{ totalCount: number; minorCount: number; moderateCount: number; severeCount: number }>('/audit/violation-stats')
}
