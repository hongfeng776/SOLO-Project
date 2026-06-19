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
  SystemLogOption,
  CronLog,
  CronLogListParams,
  CronLogStatsData,
  CronLogBatchStatsData,
  CronLogTraceabilityResult,
  CronLogOption
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

// ==================== 定时任务日志 ====================

export const validateCronLogParams = (params: CronLogListParams) => {
  return request.get<LogValidationResult>('/cron-logs/validate', params)
}

export const getCronLogList = (params: CronLogListParams) => {
  return request.get<PageResult<CronLog> & { warnings?: string[] }>('/cron-logs', params)
}

export const getCronLogDetail = (id: number) => {
  return request.get<CronLog>(`/cron-logs/${id}`)
}

export const getCronLogStats = (params?: { startDate?: string; endDate?: string; taskType?: string; taskGroup?: string }) => {
  return request.get<CronLogStatsData>('/cron-logs/stats', params)
}

export const getCronLogBatchStats = (params?: { period?: string; taskType?: string; taskGroup?: string }) => {
  return request.get<CronLogBatchStatsData>('/cron-logs/batch-stats', params)
}

export const getCronLogTraceability = (params?: { startDate?: string; endDate?: string; taskType?: string; taskGroup?: string; anomalyType?: string }) => {
  return request.get<CronLogTraceabilityResult>('/cron-logs/traceability', params)
}

export const getCronTaskTypeList = () => {
  return request.get<CronLogOption[]>('/cron-logs/task-types')
}

export const getCronStatusList = () => {
  return request.get<CronLogOption[]>('/cron-logs/statuses')
}

export const getCronTriggerTypeList = () => {
  return request.get<CronLogOption[]>('/cron-logs/trigger-types')
}

export const getCronTaskNameList = (params?: { taskType?: string; taskGroup?: string }) => {
  return request.get<CronLogOption[]>('/cron-logs/task-names', params)
}

export const getCronTaskGroupList = () => {
  return request.get<CronLogOption[]>('/cron-logs/task-groups')
}

export const createCronLog = (data: Partial<CronLog>) => {
  return request.post<CronLog>('/cron-logs', data)
}
