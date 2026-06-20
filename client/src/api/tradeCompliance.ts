import { get, post, put } from '@utils/request'
import type {
  ITradeComplianceAudit,
  ITradeCompliancePreCheckResult,
  ITradeComplianceAuditLog,
  ITradeComplianceBatchPreview,
  ITradeComplianceStats,
  ITradeComplianceBatchParams,
  ITradeComplianceListParams,
  IApiResponse,
  IPaginatedData,
} from '@/types/api'

export function getTradeComplianceList(params: ITradeComplianceListParams): Promise<IApiResponse<IPaginatedData<ITradeComplianceAudit>>> {
  return get<IPaginatedData<ITradeComplianceAudit>>('/api/trade-compliance-audits', params as Record<string, any>)
}

export function getTradeComplianceById(id: number): Promise<IApiResponse<ITradeComplianceAudit>> {
  return get<ITradeComplianceAudit>(`/api/trade-compliance-audits/${id}`)
}

export function getTradeComplianceLogs(id: number): Promise<IApiResponse<ITradeComplianceAuditLog[]>> {
  return get<ITradeComplianceAuditLog[]>(`/api/trade-compliance-audits/${id}/logs`)
}

export function preCheckTradeCompliance(id: number): Promise<IApiResponse<ITradeCompliancePreCheckResult>> {
  return post<ITradeCompliancePreCheckResult>(`/api/trade-compliance-audits/${id}/pre-check`, {})
}

export function createTradeComplianceAudit(data: Partial<ITradeComplianceAudit>): Promise<IApiResponse<ITradeComplianceAudit>> {
  return post<ITradeComplianceAudit>('/api/trade-compliance-audits', data)
}

export function approveTradeCompliance(id: number, opinion: string): Promise<IApiResponse<ITradeComplianceAudit>> {
  return put<ITradeComplianceAudit>(`/api/trade-compliance-audits/${id}/approve`, { opinion })
}

export function rejectTradeCompliance(id: number, opinion: string, violationTypes: string[], violationReasons: string[]): Promise<IApiResponse<ITradeComplianceAudit>> {
  return put<ITradeComplianceAudit>(`/api/trade-compliance-audits/${id}/reject`, { opinion, violationTypes, violationReasons })
}

export function batchAuditTradeCompliance(params: ITradeComplianceBatchParams): Promise<IApiResponse<any>> {
  return post<any>('/api/trade-compliance-audits/batch-audit', params)
}

export function batchPreviewTradeCompliance(ids: number[]): Promise<IApiResponse<ITradeComplianceBatchPreview>> {
  return post<ITradeComplianceBatchPreview>('/api/trade-compliance-audits/batch-preview', { ids })
}

export function markTimeoutTradeCompliance(): Promise<IApiResponse<{ marked: number }>> {
  return post<{ marked: number }>('/api/trade-compliance-audits/mark-timeout', {})
}

export function getTradeComplianceStats(): Promise<IApiResponse<ITradeComplianceStats>> {
  return get<ITradeComplianceStats>('/api/trade-compliance-audits/stats')
}
