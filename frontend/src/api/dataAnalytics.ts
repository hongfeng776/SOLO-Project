import request from '@/utils/request'
import type {
  DataPreValidateResult,
  DataOverview,
  ResourceDataDetail,
  BatchSummaryResult,
  DataTraceResult,
  DataQueryLogItem,
  DataListParams,
  DataQueryLogParams
} from '@/types'
import type { PageResult } from '@/types'

export const getDataOverview = () => {
  return request.get<DataOverview>('/data-analytics/overview')
}

export const preValidateDataQuery = (params: any) => {
  return request.post<DataPreValidateResult>('/data-analytics/validate', params)
}

export const getDataResourceList = (params: DataListParams) => {
  return request.get<PageResult<any>>('/data-analytics/resources', params)
}

export const getResourceDataDetail = (id: number) => {
  return request.get<ResourceDataDetail>(`/data-analytics/resources/${id}`)
}

export const traceResourceData = (id: number, days?: number) => {
  return request.get<DataTraceResult>(`/data-analytics/resources/${id}/trace`, { days } as any)
}

export const batchSummaryData = (ids: number[]) => {
  return request.post<BatchSummaryResult>('/data-analytics/batch-summary', { ids })
}

export const getDataQueryLogs = (params: DataQueryLogParams) => {
  return request.get<PageResult<DataQueryLogItem>>('/data-analytics/query-logs', params)
}
