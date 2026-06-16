import { http } from '@/utils/request'
import type { ActivityItem, PaginationParams, PaginationResult, EnumOption } from '@/types'

export const getActivityListApi = (params: PaginationParams): Promise<PaginationResult<ActivityItem>> => {
  return http.get<PaginationResult<ActivityItem>>('/api/v1/activities', params)
}

export const getActivityDetailApi = (id: number): Promise<ActivityItem> => {
  return http.get<ActivityItem>(`/api/v1/activities/${id}`)
}

export const createActivityApi = (data: Partial<ActivityItem>): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/activities', data)
}

export const updateActivityApi = (id: number, data: Partial<ActivityItem>): Promise<void> => {
  return http.put<void>(`/api/v1/activities/${id}`, data)
}

export const deleteActivityApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/activities/${id}`)
}

export const getEnumsApi = (): Promise<Record<string, EnumOption[]>> => {
  return http.get<Record<string, EnumOption[]>>('/api/v1/common/enums')
}
