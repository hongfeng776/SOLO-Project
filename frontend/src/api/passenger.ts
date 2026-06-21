import request from '@/utils/request'
import type {
  Passenger,
  PassengerQueryParams,
  TravelRecordQueryParams,
  TravelRiskCalcResult,
  TravelPermissionResult,
  TravelTraceDetail,
  PassengerTravelRisk,
  PassengerExportTask,
  PassengerBehaviorReport,
  ExportTaskCreateParams
} from '@/types/passenger'
import type { PageResult } from '@/utils/request'

export const getPassengerListApi = (params: PassengerQueryParams) => {
  return request.get<PageResult<Passenger>>('/passenger', params)
}

export const getPassengerDetailApi = (id: number) => {
  return request.get<Passenger>(`/passenger/${id}`)
}

export const createPassengerApi = (data: Partial<Passenger>) => {
  return request.post<Passenger>('/passenger', data)
}

export const updatePassengerApi = (id: number, data: Partial<Passenger>) => {
  return request.put<Passenger>(`/passenger/${id}`, data)
}

export const deletePassengerApi = (id: number) => {
  return request.delete(`/passenger/${id}`)
}

export const updatePassengerStatusApi = (id: number, status: number) => {
  return request.put(`/passenger/${id}/status`, { status })
}

export const validatePhoneApi = (phone: string, id?: number) => {
  return request.get('/passenger/validate/phone', { phone, id })
}

export const validateIdCardApi = (data: { idCard: string; realName: string; passengerId?: number }) => {
  return request.post('/passenger/validate/idcard', data)
}

export const validateBeforeUpdateApi = (id: number, fields?: string) => {
  return request.get(`/passenger/${id}/validate-update`, { fields })
}

export const updatePassengerWithValidationApi = (id: number, data: Partial<Passenger>) => {
  return request.put<Passenger>(`/passenger/${id}/update-with-validation`, data)
}

export const calculateLevelApi = (id: number) => {
  return request.post(`/passenger/${id}/calculate-level`)
}

export const batchOperationApi = (data: { ids: number[]; operationType: string; params?: any }) => {
  return request.post('/passenger/batch', data)
}

export const getAuditLogsApi = (id: number, params?: any) => {
  return request.get(`/passenger/${id}/audit-logs`, params)
}

export const getOperationLogsApi = (id: number, params?: any) => {
  return request.get(`/passenger/${id}/operation-logs`, params)
}

export const getRiskOverviewApi = (id: number) => {
  return request.get(`/passenger/${id}/risk-overview`)
}

export const updateTagsApi = (id: number, tags: string[]) => {
  return request.put(`/passenger/${id}/tags`, { tags })
}

export const getTravelRecordsApi = (id: number, params: TravelRecordQueryParams) => {
  return request.get<PageResult<any>>(`/passenger/${id}/travel-records`, params)
}

export const calculateTravelRiskApi = (id: number) => {
  return request.post<TravelRiskCalcResult>(`/passenger/${id}/calculate-travel-risk`)
}

export const getTravelRiskListApi = (id: number, params?: any) => {
  return request.get<PageResult<PassengerTravelRisk>>(`/passenger/${id}/travel-risks`, params)
}

export const createExportTaskApi = (data: ExportTaskCreateParams) => {
  return request.post<PassengerExportTask>('/passenger/export', data)
}

export const getExportTaskListApi = (params?: any) => {
  return request.get<PageResult<PassengerExportTask>>('/passenger/export/list', params)
}

export const getTravelTraceDetailApi = (id: number, orderId: number) => {
  return request.get<TravelTraceDetail>(`/passenger/${id}/travel-trace/${orderId}`)
}

export const createBehaviorReportApi = (id: number, data?: any) => {
  return request.post<PassengerBehaviorReport>(`/passenger/${id}/behavior-report`, data)
}

export const getBehaviorReportListApi = (id: number, params?: any) => {
  return request.get<PageResult<PassengerBehaviorReport>>(`/passenger/${id}/behavior-reports`, params)
}

export const getBehaviorReportDetailApi = (id: number, reportId: number) => {
  return request.get<PassengerBehaviorReport>(`/passenger/${id}/behavior-report/${reportId}`)
}

export const reviewBehaviorReportApi = (id: number, reportId: number, data: any) => {
  return request.put<PassengerBehaviorReport>(`/passenger/${id}/behavior-report/${reportId}/review`, data)
}

export const checkTravelPermissionApi = () => {
  return request.get<TravelPermissionResult>('/passenger/travel-permission')
}
