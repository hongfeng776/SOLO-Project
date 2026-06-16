import { get, post, put, del } from '@utils/request'
import type { PageParams, PageResult } from '@types'
import type { User, UserForm } from '@types/business'

export interface UserQueryParams extends PageParams {
  username?: string
  realName?: string
  orgId?: number
  status?: number
}

export function getUserListApi(params: UserQueryParams) {
  return get<PageResult<User>>('/system/user/list', params)
}

export function getUserDetailApi(id: number) {
  return get<User>(`/system/user/${id}`)
}

export function createUserApi(data: UserForm) {
  return post<User>('/system/user', data)
}

export function updateUserApi(data: UserForm) {
  return put<User>(`/system/user/${data.id}`, data)
}

export function deleteUserApi(id: number) {
  return del<void>(`/system/user/${id}`)
}

export function batchDeleteUserApi(ids: number[]) {
  return post<void>('/system/user/batchDelete', { ids })
}

export function updateUserStatusApi(id: number, status: number) {
  return put<void>(`/system/user/${id}/status`, { status })
}

export function resetUserPasswordApi(id: number, password: string) {
  return put<void>(`/system/user/${id}/resetPassword`, { password })
}
