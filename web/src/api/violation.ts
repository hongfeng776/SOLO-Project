import { get, post, put, del } from '@/utils/request'
import type { Result, PageResult } from '@/types/api'
import type { ViolationVO } from '@/types/api'

export interface ViolationQuery {
  pageNum?: number
  pageSize?: number
  userId?: number
  targetType?: string
  status?: number
  handlerId?: number
}

export function getViolationList(params: ViolationQuery) {
  return get<Result<PageResult<ViolationVO>>>('/violation/list', params)
}

export function createViolation(data: any) {
  return post<Result<void>>('/violation', data)
}

export function handleViolation(data: { id: number; status: number; handleResult: string }) {
  return put<Result<void>>('/violation/handle', data)
}

export function removeViolation(ids: number[]) {
  return del<Result<void>>('/violation', { ids })
}
