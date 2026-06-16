import { get } from '@utils/request'

export interface OverviewData {
  todayTransactionAmount: number
  todayTransactionCount: number
  pendingAuditCount: number
  activeUserCount: number
  totalProductCount: number
  totalChannelCount: number
}

export interface ChannelItem {
  channelCode: string
  channelName: string
  amount: number
  count: number
  percentage: number
}

export interface TrendItem {
  date: string
  amount: number
  count: number
}

export interface AuditItem {
  status: string
  count: number
  percentage: number
}

export interface RiskItem {
  riskLevel: string
  count: number
  percentage: number
}

export interface OrgItem {
  orgCode: string
  orgName: string
  transactionAmount: number
  transactionCount: number
  auditPassRate: number
}

export interface CustomerItem {
  customerType: string
  count: number
  percentage: number
  totalAssets: number
}

export function getOverviewApi() {
  return get<OverviewData>('/dashboard/overview')
}

export function getChannelApi() {
  return get<ChannelItem[]>('/dashboard/channel')
}

export function getTrendApi(days: number = 7) {
  return get<TrendItem[]>(`/dashboard/trend?days=${days}`)
}

export function getAuditApi() {
  return get<AuditItem[]>('/dashboard/audit')
}

export function getRiskApi() {
  return get<RiskItem[]>('/dashboard/risk')
}

export function getOrgApi() {
  return get<OrgItem[]>('/dashboard/org')
}

export function getCustomerApi() {
  return get<CustomerItem[]>('/dashboard/customer')
}
