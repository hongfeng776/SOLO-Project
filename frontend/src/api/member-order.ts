import { http } from '@/utils/request'
import type {
  MemberOrderItem,
  MemberOrderLogItem,
  MemberOrderRefundItem,
  MemberOrderStatsResult,
  MemberOrderConsistencyResult,
  MemberOrderTraceResult,
  MemberOrderBatchActionParams,
  MemberOrderBatchActionResult,
  MemberOrderQueryParams,
  PaginationResult,
} from '@/types'

const BASE = '/api/v1/member-orders'

export const getMemberOrderListApi = (
  params: MemberOrderQueryParams
): Promise<PaginationResult<MemberOrderItem>> => {
  return http.get<PaginationResult<MemberOrderItem>>(BASE, params)
}

export const getMemberOrderDetailApi = (id: number): Promise<MemberOrderItem> => {
  return http.get<MemberOrderItem>(`${BASE}/${id}`)
}

export const getMemberOrderStatsApi = (): Promise<MemberOrderStatsResult> => {
  return http.get<MemberOrderStatsResult>(`${BASE}/stats`)
}

export const verifyMemberOrderApi = (id: number, data?: { remark?: string }): Promise<MemberOrderItem> => {
  return http.post<MemberOrderItem>(`${BASE}/${id}/verify`, data)
}

export const cancelMemberOrderApi = (id: number): Promise<MemberOrderItem> => {
  return http.post<MemberOrderItem>(`${BASE}/${id}/cancel`)
}

export const refundMemberOrderApi = (
  id: number,
  data: { refundAmount?: number; refundReason: string }
): Promise<MemberOrderItem> => {
  return http.post<MemberOrderItem>(`${BASE}/${id}/refund`, data)
}

export const appealMemberOrderApi = (
  id: number,
  data: { appealReason: string }
): Promise<MemberOrderItem> => {
  return http.post<MemberOrderItem>(`${BASE}/${id}/appeal`, data)
}

export const resolveAbnormalOrderApi = (
  id: number,
  data?: { resolveRemark?: string }
): Promise<MemberOrderItem> => {
  return http.post<MemberOrderItem>(`${BASE}/${id}/resolve-abnormal`, data)
}

export const batchActionMemberOrderApi = (
  data: MemberOrderBatchActionParams
): Promise<MemberOrderBatchActionResult> => {
  return http.post<MemberOrderBatchActionResult>(`${BASE}/batch-action`, data)
}

export const getMemberOrderLogsApi = (
  orderId: number,
  params?: { page?: number; pageSize?: number; logType?: string }
): Promise<PaginationResult<MemberOrderLogItem>> => {
  return http.get<PaginationResult<MemberOrderLogItem>>(`${BASE}/${orderId}/logs`, params)
}

export const getMemberOrderTraceApi = (params: {
  traceType: 'orderNo' | 'uid' | 'payBatch'
  traceValue: string
}): Promise<MemberOrderTraceResult> => {
  return http.get<MemberOrderTraceResult>(`${BASE}/trace`, params)
}

export const checkMemberOrderConsistencyApi = (id: number): Promise<MemberOrderConsistencyResult> => {
  return http.get<MemberOrderConsistencyResult>(`${BASE}/${id}/consistency`)
}
