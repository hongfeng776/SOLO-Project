import { get, post, put } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  TrafficAnomalyRecord,
  TrafficAnomalyHandleLog,
  TrafficAnomalyStats,
  AnomalyDetectionResult,
  AnomalyValidationResult,
  TrafficAnomalyBatchResult,
  TrafficAnomalyImpactAnalysis
} from '@/types/business'

export const getTrafficAnomalyStats = () => {
  return get<TrafficAnomalyStats>('/traffic-anomaly-control/stats')
}

export const getTrafficAnomalyList = (params: {
  page?: number
  pageSize?: number
  keyword?: string
  anomalyType?: string
  riskLevel?: number
  status?: number
  source?: string
  startTime?: string
  endTime?: string
}) => {
  return get<PageResult<TrafficAnomalyRecord>>('/traffic-anomaly-control', params)
}

export const getTrafficAnomalyDetail = (id: number) => {
  return get<{
    anomaly: TrafficAnomalyRecord
    handleLogs: TrafficAnomalyHandleLog[]
    validation: AnomalyValidationResult
  }>(`/traffic-anomaly-control/${id}`)
}

export const detectTrafficAnomaly = (data: {
  exposureCount?: number
  exposureFrequency?: number
  uniqueIpCount?: number
  uniqueDeviceCount?: number
  uniqueUserCount?: number
  ipAddress?: string
  userSource?: string
}) => {
  return post<AnomalyDetectionResult>('/traffic-anomaly-control/detect', data)
}

export const createTrafficAnomaly = (data: Partial<TrafficAnomalyRecord>) => {
  return post<TrafficAnomalyRecord>('/traffic-anomaly-control', data)
}

export const handleTrafficAnomaly = (id: number, data: {
  handleType: string
  reason: string
}) => {
  return put<{
    anomaly: TrafficAnomalyRecord
    handleLog: TrafficAnomalyHandleLog
  }>(`/traffic-anomaly-control/${id}/handle`, data)
}

export const batchHandleTrafficAnomalies = (data: {
  ids?: number[]
  anomalyType?: string
  riskLevel?: number
  handleType: string
  reason: string
}) => {
  return post<TrafficAnomalyBatchResult>('/traffic-anomaly-control/batch', data)
}

export const getTrafficAnomalyHandleLogs = (params: {
  page?: number
  pageSize?: number
  keyword?: string
  handleType?: string
  handleStatus?: number
  blockReason?: string
  startTime?: string
  endTime?: string
}) => {
  return get<PageResult<TrafficAnomalyHandleLog>>('/traffic-anomaly-control/logs', params)
}

export const getTrafficAnomalyImpactAnalysis = (id: number) => {
  return get<TrafficAnomalyImpactAnalysis>(`/traffic-anomaly-control/${id}/impact`)
}
