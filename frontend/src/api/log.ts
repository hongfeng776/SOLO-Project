import { get, del, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'
import type { OperationLog } from '@types/business'

export interface LogQueryParams extends PageParams {
  username?: string
  module?: string
  operation?: string
  status?: number
  startTime?: string
  endTime?: string
}

export function getOperationLogListApi(params: LogQueryParams) {
  return get<PageResult<OperationLog>>('/system/log/operation/list', params)
}

export function getOperationLogDetailApi(id: number) {
  return get<OperationLog>(`/system/log/operation/${id}`)
}

export function deleteOperationLogApi(id: number) {
  return del<void>(`/system/log/operation/${id}`)
}

export function clearOperationLogApi() {
  return post<void>('/system/log/operation/clear')
}

export function exportOperationLogApi(params: LogQueryParams) {
  return post<{ downloadUrl: string }>('/system/log/operation/export', params)
}
