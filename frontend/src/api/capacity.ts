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
  ReportParams,
  SmartDispatchPrecheckParams,
  SmartDispatchPrecheckResult,
  SmartMatchParams,
  SmartMatchResult,
  BatchSmartDispatchParams,
  BatchSmartDispatchResult,
  DispatchTraceResult,
  PeriodConfigPrecheckParams,
  PeriodConfigPrecheckResult,
  SceneAdaptiveParams,
  SceneAdaptiveResult,
  BatchPeriodConfigParams,
  BatchPeriodConfigResult,
  PeriodConfigTraceResult
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

export const smartDispatchPrecheckApi = (data: SmartDispatchPrecheckParams) => {
  return request.post<SmartDispatchPrecheckResult>('/capacity/smart-dispatch/precheck', data)
}

export const smartMatchDispatchApi = (data: SmartMatchParams) => {
  return request.post<SmartMatchResult>('/capacity/smart-dispatch/match', data)
}

export const batchSmartDispatchApi = (data: BatchSmartDispatchParams) => {
  return request.post<BatchSmartDispatchResult>('/capacity/smart-dispatch/batch', data)
}

export const getDispatchTraceApi = (params?: { taskId?: string; startDate?: string; endDate?: string; area?: string; validationType?: string }) => {
  return request.get<DispatchTraceResult>('/capacity/smart-dispatch/trace', params)
}

export const periodConfigPrecheckApi = (data: PeriodConfigPrecheckParams) => {
  return request.post<PeriodConfigPrecheckResult>('/capacity/period-config/precheck', data)
}

export const sceneAdaptiveConfigApi = (data: SceneAdaptiveParams) => {
  return request.post<SceneAdaptiveResult>('/capacity/period-config/scene-adapt', data)
}

export const batchPeriodConfigApi = (data: BatchPeriodConfigParams) => {
  return request.post<BatchPeriodConfigResult>('/capacity/period-config/batch', data)
}

export const getPeriodConfigTraceApi = (params?: { city?: string; startDate?: string; endDate?: string; period?: string; operatorId?: string }) => {
  return request.get<PeriodConfigTraceResult>('/capacity/period-config/trace', params)
}
