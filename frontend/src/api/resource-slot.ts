import { get, post, put, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { ResourceSlot } from '@/types/business'

export const getResourceSlotList = (params: Record<string, unknown>): Promise<PageResult<ResourceSlot>> => {
  return get<PageResult<ResourceSlot>>('/resource-slot', params)
}

export const getResourceSlotDetail = (id: number): Promise<ResourceSlot> => {
  return get<ResourceSlot>(`/resource-slot/${id}`)
}

export const createResourceSlot = (data: Partial<ResourceSlot>): Promise<{ id: number }> => {
  return post<{ id: number }>('/resource-slot', data)
}

export const updateResourceSlot = (id: number, data: Partial<ResourceSlot>): Promise<{ id: number }> => {
  return put<{ id: number }>(`/resource-slot/${id}`, data)
}

export const deleteResourceSlot = (id: number): Promise<null> => {
  return del<null>(`/resource-slot/${id}`)
}

export const updateResourceSlotStatus = (id: number, status: number): Promise<{ id: number }> => {
  return put<{ id: number }>(`/resource-slot/${id}/status`, { status })
}
