import { http } from '@/utils/request'
import type { MemberItem, PaginationParams, PaginationResult, MemberStatsResult } from '@/types'

export const getMemberListApi = (params: PaginationParams): Promise<PaginationResult<MemberItem>> => {
  return http.get<PaginationResult<MemberItem>>('/api/v1/members', params)
}

export const getMemberDetailApi = (id: number): Promise<MemberItem> => {
  return http.get<MemberItem>(`/api/v1/members/${id}`)
}

export const createMemberApi = (data: Partial<MemberItem>): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/members', data)
}

export const updateMemberApi = (id: number, data: Partial<MemberItem>): Promise<void> => {
  return http.put<void>(`/api/v1/members/${id}`, data)
}

export const renewMemberApi = (id: number, data: { planDuration: number; planPrice: number; currentPlan: string }): Promise<void> => {
  return http.post<void>(`/api/v1/members/${id}/renew`, data)
}

export const upgradeMemberApi = (id: number, data: { newLevel: number; planData?: Record<string, any> }): Promise<void> => {
  return http.post<void>(`/api/v1/members/${id}/upgrade`, data)
}

export const freezeMemberApi = (id: number): Promise<void> => {
  return http.post<void>(`/api/v1/members/${id}/freeze`)
}

export const unfreezeMemberApi = (id: number): Promise<void> => {
  return http.post<void>(`/api/v1/members/${id}/unfreeze`)
}

export const getMemberStatsApi = (): Promise<MemberStatsResult> => {
  return http.get<MemberStatsResult>('/api/v1/members/stats')
}
