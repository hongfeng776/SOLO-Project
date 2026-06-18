import request from '@/utils/request'
import type {
  PageResult,
  OperationLog,
  LogValidationResult,
  LogOperator,
  LogModuleOption,
  LogActionOption,
  LogListParams,
  LogStatsData,
  LogTraceResult,
  LogExportParams,
  LogExportResult
} from '@/types'

export const validateLogParams = (params: LogListParams) => {
  return request.get<LogValidationResult>('/logs/validate', params)
}

export const getLogList = (params: LogListParams) => {
  return request.get<PageResult<OperationLog> & { warnings?: string[] }>('/logs', params)
}

export const getLogDetail = (id: number) => {
  return request.get<OperationLog>(`/logs/${id}`)
}

export const getLogStats = (params?: { startDate?: string; endDate?: string }) => {
  return request.get<LogStatsData>('/logs/stats', params)
}

export const getLogTrace = (traceId: string) => {
  return request.get<LogTraceResult>(`/logs/trace/${traceId}`)
}

export const getLogTraceByLogId = (logId: number) => {
  return request.get<LogTraceResult>(`/logs/trace-by-log/${logId}`)
}

export const getLogOperators = (params?: { keyword?: string }) => {
  return request.get<LogOperator[]>('/logs/operators', params)
}

export const getLogModuleList = () => {
  return request.get<LogModuleOption[]>('/logs/modules')
}

export const getLogActionList = () => {
  return request.get<LogActionOption[]>('/logs/actions')
}

export const validateLogExport = (params: LogExportParams) => {
  return request.post<LogValidationResult>('/logs/validate-export', params)
}

export const exportLogs = (params: LogExportParams) => {
  return request.post<LogExportResult>('/logs/export', params)
}

export const createOperationLog = (data: Partial<OperationLog>) => {
  return request.post<OperationLog>('/logs', data)
}
