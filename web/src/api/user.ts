import { get, post, put, request } from '@/utils/request'
import type { Result, PageResult } from '@/types/api'
import type { UserVO } from '@/types/api'

export interface UserQuery {
  pageNum?: number
  pageSize?: number
  username?: string
  status?: number
  keyword?: string
}

export function getUserList(params: UserQuery) {
  return get<Result<PageResult<UserVO>>>('/user', params)
}

export function getUserDetail(id: number) {
  return get<Result<UserVO>>(`/user/${id}`)
}

export function createUser(data: any) {
  return post<Result<void>>('/user', data)
}

export function updateUser(data: any) {
  return put<Result<void>>('/user', data)
}

export function deleteUser(ids: number[]) {
  return request<Result<void>>({ url: '/user/batch', method: 'DELETE', data: { ids } })
}

export function updateUserStatus(id: number, status: number) {
  return request<Result<void>>({ url: '/user/status', method: 'PUT', params: { id, status } })
}

export function batchUpdateUserStatus(ids: number[], status: number) {
  return put<Result<void>>('/user/batch-status', { ids, status })
}
