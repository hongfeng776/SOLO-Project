import request from '@/utils/request'
import type {
  VisibilityType,
  VisibilityPreValidateResult,
  VisibilityChangeResult,
  VisibilityBatchResult,
  VisibilityLogItem,
  VisibilityStats,
  VisibilityListParams,
  VisibilityLogParams,
  VisibilityChangeParams,
  VisibilityAuditParams,
  VisibilityDetailResult
} from '@/types'
import type { PageResult } from '@/types'

export const getVisibilityStats = () => {
  return request.get<VisibilityStats>('/resource-visibility/stats')
}

export const getVisibilityResourceList = (params: VisibilityListParams) => {
  return request.get<PageResult<any>>('/resource-visibility/resources', params)
}

export const getVisibilityLogs = (params: VisibilityLogParams) => {
  return request.get<PageResult<VisibilityLogItem>>('/resource-visibility/logs', params)
}

export const getResourceVisibilityDetail = (id: number) => {
  return request.get<VisibilityDetailResult>(`/resource-visibility/resources/${id}`)
}

export const preValidateVisibility = (resourceId: number, targetVisibility: VisibilityType) => {
  return request.post<VisibilityPreValidateResult>('/resource-visibility/validate', {
    resourceId,
    targetVisibility
  })
}

export const changeVisibility = (id: number, params: VisibilityChangeParams) => {
  return request.post<VisibilityChangeResult>(`/resource-visibility/resources/${id}/change`, params)
}

export const batchChangeVisibility = (params: {
  ids: number[]
  newVisibility: VisibilityType
  reason?: string
}) => {
  return request.post<VisibilityBatchResult>('/resource-visibility/batch-change', params)
}

export const auditVisibilityChange = (logId: number, params: VisibilityAuditParams) => {
  return request.post<any>(`/resource-visibility/audit/${logId}`, params)
}
