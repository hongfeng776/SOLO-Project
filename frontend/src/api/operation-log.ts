import { get, del, post } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { OperationLog } from '@/types/business'

export const getOperationLogList = (params: Record<string, unknown>): Promise<PageResult<OperationLog>> => {
  return get<PageResult<OperationLog>>('/operation-log', params)
}

export const getOperationLogDetail = (id: number): Promise<OperationLog> => {
  return get<OperationLog>(`/operation-log/${id}`)
}

export const deleteOperationLog = (id: number): Promise<null> => {
  return del<null>(`/operation-log/${id}`)
}

export const batchDeleteOperationLogs = (ids: number[]): Promise<null> => {
  return post<null>('/operation-log/batch-delete', { ids })
}

export const cleanOperationLogs = (params: { days?: number }): Promise<null> => {
  return post<null>('/operation-log/clean', params)
}
