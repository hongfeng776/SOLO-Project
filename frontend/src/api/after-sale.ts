import request from '@/utils/request'
import type { PageResult } from '@/utils/request'
import type {
  AfterSaleTicket,
  SubmitPrerequisiteResult,
  AfterSaleSubmitResult,
  TicketAuditLogItem,
  BatchOperationResult,
  TicketTraceData,
  TicketStatistics,
  ReputationRecordItem,
  DisputeType,
  TicketStatus,
  ReviewStep
} from '@/types/after-sale'

export const getAfterSaleListApi = (params: {
  page?: number
  pageSize?: number
  status?: TicketStatus
  disputeType?: DisputeType
  priority?: number
  orderNo?: string
  passengerPhone?: string
  assigneeId?: number
  isOverdue?: number
  filterType?: 'overdue' | 'pending_review' | 'rejected' | 'all'
}) => {
  return request.get<PageResult<AfterSaleTicket>>('/after-sale', params)
}

export const getAfterSaleDetailApi = (id: number) => {
  return request.get<AfterSaleTicket>(`/after-sale/${id}`)
}

export const getSubmitPrerequisitesApi = (orderId: number, passengerId: number) => {
  return request.get<SubmitPrerequisiteResult>(`/after-sale/prerequisites/${orderId}`, { passengerId })
}

export const submitAfterSaleApi = (orderId: number, data: {
  disputeType: DisputeType
  content: string
  refundAmount?: number
  evidences?: string[]
  passengerId?: number
  passengerName?: string
  passengerPhone?: string
}) => {
  return request.post<AfterSaleSubmitResult>(`/after-sale/submit/${orderId}`, data)
}

export const processTicketApi = (id: number, data: {
  targetStatus: TicketStatus
  handleResult?: string
  rejectReason?: string
  actualRefundAmount?: number
  remark?: string
}) => {
  return request.put(`/after-sale/process/${id}`, data)
}

export const resolveTicketApi = (id: number, data: {
  handleResult: string
  actualRefundAmount?: number
  remark?: string
}) => {
  return request.put(`/after-sale/resolve/${id}`, data)
}

export const rejectTicketApi = (id: number, data: {
  rejectReason: string
  remark?: string
}) => {
  return request.put(`/after-sale/reject/${id}`, data)
}

export const closeTicketApi = (id: number, data?: { remark?: string }) => {
  return request.put(`/after-sale/close/${id}`, data)
}

export const getTicketAuditLogsApi = (ticketId: number, params?: { page?: number; pageSize?: number }) => {
  return request.get<PageResult<TicketAuditLogItem>>(`/after-sale/logs/${ticketId}`, params)
}

export const getBatchPreviewApi = (params: {
  filterType?: 'overdue' | 'pending_review' | 'rejected'
  status?: TicketStatus
  disputeType?: DisputeType
  startTime?: string
  endTime?: string
}) => {
  return request.get<{
    total: number
    eligibleCount: number
    excludedCount: number
    eligible: Array<{ id: number; ticketNo: string; orderNo: string; status: number; disputeType: number; passengerName: string; createTime: string; deadline: string; isOverdue: number }>
    excluded: Array<{ id: number; ticketNo: string; orderNo: string; reason: string }>
  }>('/after-sale/batch/preview', params)
}

export const batchOperationApi = (data: {
  ids: number[]
  operation: 'urge' | 'review' | 'close'
}) => {
  return request.post<BatchOperationResult>('/after-sale/batch', data)
}

export const getTicketTraceApi = (id: number) => {
  return request.get<TicketTraceData>(`/after-sale/trace/${id}`)
}

export const getTicketStatisticsApi = () => {
  return request.get<TicketStatistics>('/after-sale/statistics')
}

export const getReputationRecordsApi = (passengerId: number, params?: { page?: number; pageSize?: number }) => {
  return request.get<PageResult<ReputationRecordItem>>(`/after-sale/reputation/${passengerId}`, params)
}
