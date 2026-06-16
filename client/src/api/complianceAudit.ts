import { get, post, put, del } from '@utils/request'
import type { IComplianceAudit, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IComplianceAudit>>> {
  return get<IPaginatedData<IComplianceAudit>>('/api/compliance-audits', params)
}

export function getById(id: number): Promise<IApiResponse<IComplianceAudit>> {
  return get<IComplianceAudit>(`/api/compliance-audits/${id}`)
}

export function create(data: Partial<IComplianceAudit>): Promise<IApiResponse<IComplianceAudit>> {
  return post<IComplianceAudit>('/api/compliance-audits', data)
}

export function update(id: number, data: Partial<IComplianceAudit>): Promise<IApiResponse<IComplianceAudit>> {
  return put<IComplianceAudit>(`/api/compliance-audits/${id}`, data)
}

export function remove(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/compliance-audits/${id}`)
}

export function audit(id: number, auditStatus: string, auditOpinion: string): Promise<IApiResponse<IComplianceAudit>> {
  return put<IComplianceAudit>(`/api/compliance-audits/${id}/audit`, { auditStatus, auditOpinion })
}

export function batchAudit(ids: number[], auditStatus: string, auditOpinion: string): Promise<IApiResponse<null>> {
  return put<null>('/api/compliance-audits/batch-audit', { ids, auditStatus, auditOpinion })
}

export function exportList(params: Record<string, any>): Promise<IApiResponse<Blob>> {
  return get<Blob>('/api/compliance-audits/export', params, { responseType: 'blob' })
}
