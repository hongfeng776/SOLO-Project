import { get, post, put, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Creator } from '@/types/business'

export const getCreatorList = (params: Record<string, unknown>): Promise<PageResult<Creator>> => {
  return get<PageResult<Creator>>('/creator', params)
}

export const getCreatorDetail = (id: number): Promise<Creator> => {
  return get<Creator>(`/creator/${id}`)
}

export const createCreator = (data: Partial<Creator>): Promise<{ id: number }> => {
  return post<{ id: number }>('/creator', data)
}

export const updateCreator = (id: number, data: Partial<Creator>): Promise<{ id: number }> => {
  return put<{ id: number }>(`/creator/${id}`, data)
}

export const auditQualification = (
  id: number,
  qualificationStatus: number
): Promise<{ id: number }> => {
  return post<{ id: number }>(`/creator/${id}/qualification`, { qualificationStatus })
}

export const deleteCreator = (id: number): Promise<null> => {
  return del<null>(`/creator/${id}`)
}
