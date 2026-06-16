import { get } from '@utils/request'
import type { IApiResponse, IFundFlow, IComplianceAudit } from '@/types/api'

export interface IDashboardStats {
  totalAsset: number
  todayTransaction: number
  customerCount: number
  productCount: number
  pendingAuditCount: number
  riskWarningCount: number
}

export interface IRecentFlow extends IFundFlow {
  customerName: string
}

export interface IRecentAudit extends IComplianceAudit {
  targetName: string
}

export function getStats(): Promise<IApiResponse<IDashboardStats>> {
  return get<IDashboardStats>('/api/dashboard/stats')
}

export function getRecentFlows(limit = 10): Promise<IApiResponse<IRecentFlow[]>> {
  return get<IRecentFlow[]>('/api/dashboard/recent-flows', { limit })
}

export function getRecentAudits(limit = 10): Promise<IApiResponse<IRecentAudit[]>> {
  return get<IRecentAudit[]>('/api/dashboard/recent-audits', { limit })
}
