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
  LogExportResult,
  SystemLog,
  SystemLogPermission,
  SystemLogListParams,
  SystemLogStatsData,
  SystemLogBackupParams,
  SystemLogBackupResult,
  SystemLogCleanupParams,
  SystemLogCleanupResult,
  SystemLogTraceabilityResult,
  SystemLogOption
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

// ==================== 系统日志 ====================

export const getSystemLogPermission = () => {
  return request.get<SystemLogPermission>('/system-logs/permission')
}

export const validateSystemLogParams = (params: SystemLogListParams) => {
  return request.get<LogValidationResult>('/system-logs/validate', params)
}

export const getSystemLogList = (params: SystemLogListParams) => {
  return request.get<PageResult<SystemLog> & { warnings?: string[] }>('/system-logs', params)
}

export const getSystemLogDetail = (id: number) => {
  return request.get<SystemLog>(`/system-logs/${id}`)
}

export const getSystemLogStats = (params?: { startDate?: string; endDate?: string }) => {
  return request.get<SystemLogStatsData>('/system-logs/stats', params)
}

export const getSystemLogTraceability = (params?: { startDate?: string; endDate?: string; module?: string; logType?: string }) => {
  return request.get<SystemLogTraceabilityResult>('/system-logs/traceability', params)
}

export const backupSystemLogs = (params: SystemLogBackupParams) => {
  return request.post<SystemLogBackupResult>('/system-logs/backup', params)
}

export const cleanupSystemLogs = (params: SystemLogCleanupParams) => {
  return request.post<SystemLogCleanupResult>('/system-logs/cleanup', params)
}

export const getSystemLogTypeList = () => {
  return request.get<SystemLogOption[]>('/system-logs/types')
}

export const getSystemLogLevelList = () => {
  return request.get<SystemLogOption[]>('/system-logs/levels')
}

export const getSystemLogModuleList = () => {
  return request.get<SystemLogOption[]>('/system-logs/modules')
}

export const createSystemLog = (data: Partial<SystemLog>) => {
  return request.post<SystemLog>('/system-logs', data)
}
