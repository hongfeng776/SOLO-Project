import request from '@/utils/request'
import type {
  CapacityType,
  CapacityMonitor,
  CapacityMonitorData,
  CapacityStatusDetail,
  BatchDispatchResponse,
  CapacityTrendData,
  CapacityReport,
  MonitorFilters,
  BatchDispatchParams,
  ReportParams
} from '@/types/capacity'
import type { PageResult } from '@/utils/request'

export const getCapacityMonitorApi = (params?: MonitorFilters) => {
  return request.get<CapacityMonitorData>('/capacity/monitor', params)
}

export const getCapacityStatusDetailApi = () => {
  return request.get<CapacityStatusDetail>('/capacity/status-detail')
}

export const batchDispatchApi = (data: BatchDispatchParams) => {
  return request.post<BatchDispatchResponse>('/capacity/batch-dispatch', data)
}

export const getCapacityTrendApi = (params?: { city?: string; timeRange?: string }) => {
  return request.get<CapacityTrendData>('/capacity/trend', params)
}

export const generateReportApi = (data: ReportParams) => {
  return request.post<CapacityReport>('/capacity/report', data)
}

export const getCapacityTypeListApi = (params?: any) => {
  return request.get<PageResult<CapacityType>>('/capacity/type', params)
}

export const getCapacityTypeDetailApi = (id: number) => {
  return request.get<CapacityType>(`/capacity/type/${id}`)
}

export const createCapacityTypeApi = (data: Partial<CapacityType>) => {
  return request.post<CapacityType>('/capacity/type', data)
}

export const updateCapacityTypeApi = (id: number, data: Partial<CapacityType>) => {
  return request.put<CapacityType>(`/capacity/type/${id}`, data)
}

export const deleteCapacityTypeApi = (id: number) => {
  return request.delete(`/capacity/type/${id}`)
}
