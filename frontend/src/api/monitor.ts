import request from '@/utils/request'

export const getSystemStatusApi = () => request.get('/monitor/system-status')
export const getApiMetricsApi = (params?: any) => request.get('/monitor/api-metrics', params)
export const getOperationLogsApi = (params: any) => request.get('/monitor/operation-logs', params)
export const getAlertListApi = (params?: any) => request.get('/monitor/alerts', params)
export const getHealthCheckApi = () => request.get('/monitor/health')
