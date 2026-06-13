import { get, post, put, del } from '@/utils/request'
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
  return get<Result<PageResult<UserVO>>>('/user/list', params)
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
  return del<Result<void>>('/user', { ids })
}

export function updateUserStatus(id: number, status: number) {
  return put<Result<void>>(`/user/${id}/status`, { status })
}

export function batchUpdateUserStatus(ids: number[], status: number) {
  return put<Result<void>>('/user/status/batch', { ids, status })
}
