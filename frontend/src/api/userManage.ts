import request from '@/utils/request'
import type { PageResult, UserInfo, PageParams, Member } from '@/types'

interface UserListParams extends PageParams {
  keyword?: string
  role?: string
  status?: string
}

export const getUserList = (params: UserListParams) => {
  return request.get<PageResult<UserInfo>>('/users', params)
}

export const getUserDetail = (id: number) => {
  return request.get<UserInfo>(`/users/${id}`)
}

export const createUser = (data: Partial<UserInfo> & { password: string }) => {
  return request.post<UserInfo>('/users', data)
}

export const updateUser = (id: number, data: Partial<UserInfo>) => {
  return request.put<UserInfo>(`/users/${id}`, data)
}

export const deleteUser = (id: number) => {
  return request.delete(`/users/${id}`)
}

export const batchDeleteUser = (ids: number[]) => {
  return request.post('/users/batch-delete', { ids })
}

export const updateUserStatus = (id: number, status: string) => {
  return request.put(`/users/${id}/status`, { status })
}

interface MemberListParams extends PageParams {
  keyword?: string
  level?: string
}

export const getMemberList = (params: MemberListParams) => {
  return request.get<PageResult<Member>>('/members', params)
}

export const getMemberDetail = (id: number) => {
  return request.get<Member>(`/members/${id}`)
}

export const updateMemberLevel = (id: number, level: string) => {
  return request.put(`/members/${id}/level`, { level })
}
