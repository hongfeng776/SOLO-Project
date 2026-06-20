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
  CronLogValidationResult,
  CronLogListParams,
  CronLogStatsData,
  CronLogTraceabilityResult,
  CronLogOption,
  CronLogTaskInfo,
  ServerMonitor,
  ServerMonitorPermission,
  ServerMonitorValidationResult,
  ServerMonitorListParams,
  ServerMonitorRealtimeData,
  ServerMonitorHistoryData,
  ServerMonitorPeakData,
  ServerMonitorStatsData,
  ServerMonitorExportParams,
  ServerMonitorExportResult,
  ServerMonitorTraceabilityResult,
  ServerMonitorOption,
  ServerInfo
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

export const validateCronLogParams = (params: CronLogListParams) => {
  return request.get<CronLogValidationResult>('/cron-logs/validate', params)
}

export const getCronLogList = (params: CronLogListParams) => {
  return request.get<PageResult<CronLog>>('/cron-logs', params)
}

export const getCronLogDetail = (id: number) => {
  return request.get<CronLog>(`/cron-logs/${id}`)
}

export const getCronLogStats = (params: {
  period?: 'daily' | 'weekly' | 'monthly'
  startDate?: string
  endDate?: string
  taskType?: string
}) => {
  return request.get<CronLogStatsData>('/cron-logs/stats', params)
}

export const getCronLogTraceability = (params: {
  taskId: string
  startDate?: string
  endDate?: string
}) => {
  return request.get<CronLogTraceabilityResult>('/cron-logs/traceability', params)
}

export const getCronLogTypeList = () => {
  return request.get<CronLogOption[]>('/cron-logs/types')
}

export const getCronLogStatusList = () => {
  return request.get<CronLogOption[]>('/cron-logs/statuses')
}

export const getCronLogTriggerTypeList = () => {
  return request.get<CronLogOption[]>('/cron-logs/trigger-types')
}

export const getCronLogAnomalyTypeList = () => {
  return request.get<CronLogOption[]>('/cron-logs/anomaly-types')
}

export const getCronLogRetryStrategyList = () => {
  return request.get<CronLogOption[]>('/cron-logs/retry-strategies')
}

export const getCronTaskList = () => {
  return request.get<CronLogTaskInfo[]>('/cron-logs/tasks')
}

export const createCronLog = (data: Partial<CronLog>) => {
  return request.post<CronLog>('/cron-logs', data)
}

export const getServerMonitorPermission = () => {
  return request.get<ServerMonitorPermission>('/server-monitors/permission')
}

export const validateServerMonitorParams = (params: ServerMonitorListParams) => {
  return request.get<ServerMonitorValidationResult>('/server-monitors/validate', params)
}

export const getServerMonitorList = (params: ServerMonitorListParams) => {
  return request.get<PageResult<ServerMonitor>>('/server-monitors', params)
}

export const getServerMonitorRealtime = (params?: { serverIds?: string; environment?: string }) => {
  return request.get<ServerMonitorRealtimeData>('/server-monitors/realtime', params)
}

export const getServerMonitorHistory = (params: {
  serverId: string
  startDate?: string
  endDate?: string
  granularity?: string
}) => {
  return request.get<ServerMonitorHistoryData>('/server-monitors/history', params)
}

export const getServerMonitorPeak = (params: {
  serverId?: string
  startDate?: string
  endDate?: string
  peakType?: string
}) => {
  return request.get<ServerMonitorPeakData>('/server-monitors/peak', params)
}

export const getServerMonitorStats = (params: {
  startDate?: string
  endDate?: string
  environment?: string
  serverId?: string
}) => {
  return request.get<ServerMonitorStatsData>('/server-monitors/stats', params)
}

export const getServerMonitorAlertDetail = (id: number) => {
  return request.get<ServerMonitor>(`/server-monitors/alert/${id}`)
}

export const exportServerMonitorData = (params: ServerMonitorExportParams) => {
  return request.get<ServerMonitorExportResult>('/server-monitors/export', params)
}

export const getServerMonitorTraceability = (params: {
  serverId: string
  startDate?: string
  endDate?: string
  traceType?: string
}) => {
  return request.get<ServerMonitorTraceabilityResult>('/server-monitors/traceability', params)
}

export const getServerList = () => {
  return request.get<ServerInfo[]>('/server-monitors/servers')
}

export const getServerMonitorAlertTypeList = () => {
  return request.get<ServerMonitorOption[]>('/server-monitors/alert-types')
}

export const getServerMonitorAlertLevelList = () => {
  return request.get<ServerMonitorOption[]>('/server-monitors/alert-levels')
}

export const getServerMonitorEnvironmentList = () => {
  return request.get<ServerMonitorOption[]>('/server-monitors/environments')
}

export const getServerMonitorApiLoadLevelList = () => {
  return request.get<ServerMonitorOption[]>('/server-monitors/api-load-levels')
}

export const getServerMonitorRiskLevelList = () => {
  return request.get<ServerMonitorOption[]>('/server-monitors/risk-levels')
}
