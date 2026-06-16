import { get } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity } from '@/types'

export interface OperationLogItem extends BaseEntity {
  userId: string
  userName: string
  module: string
  action: string
  targetId?: string
  targetType?: string
  detail?: any
  ip: string
  userAgent?: string
  status: number
  errorMessage?: string
  duration: number
}

export interface OperationLogQueryParams extends PageParams {
  userId?: string
  module?: string
  action?: string
  targetType?: string
  startTime?: string
  endTime?: string
}

export function getOperationLogList(params: OperationLogQueryParams): Promise<PageResult<OperationLogItem>> {
  return get<PageResult<OperationLogItem>>('/operation-logs', params)
}
