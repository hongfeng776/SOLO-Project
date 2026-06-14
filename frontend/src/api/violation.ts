import request from '@/utils/request'

export interface ViolationQuery {
  pageNum: number
  pageSize: number
  targetName?: string
  targetType?: number | string
  type?: number | string
  handleStatus?: number | string
}

export interface ViolationForm {
  id?: number
  targetType: number | string
  targetId: number | string
  targetName: string
  type: number | string
  description: string
  handleStatus?: number | string
  handleResult?: string
}

export interface ViolationRecord {
  id: number
  targetType: number
  targetId: number
  targetName: string
  type: number
  description: string
  handleStatus: number
  handleResult: string
  createTime: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export function getViolationList(params: ViolationQuery) {
  return request<PageResult<ViolationRecord>>({
    url: '/violation/list',
    method: 'get',
    params
  })
}

export function getViolationDetail(id: number) {
  return request<ViolationRecord>({
    url: `/violation/${id}`,
    method: 'get'
  })
}

export function createViolation(data: ViolationForm) {
  return request<void>({
    url: '/violation',
    method: 'post',
    data
  })
}

export function updateViolation(data: ViolationForm) {
  return request<void>({
    url: '/violation',
    method: 'put',
    data
  })
}

export function removeViolation(id: number) {
  return request<void>({
    url: `/violation/${id}`,
    method: 'delete'
  })
}
