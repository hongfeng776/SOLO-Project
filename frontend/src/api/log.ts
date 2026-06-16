import request from '@/utils/request'
import type { PageResult, PageParams, OperationLog } from '@/types'

interface LogListParams extends PageParams {
  keyword?: string
  module?: string
  action?: string
  startDate?: string
  endDate?: string
}

interface LogStats {
  totalCount: number
  todayCount: number
  byModule: Record<string, number>
  byAction: Record<string, number>
}

export const getLogList = (params: LogListParams) => {
  return request.get<PageResult<OperationLog>>('/logs', params)
}

export const getLogStats = () => {
  return request.get<LogStats>('/logs/stats')
}
