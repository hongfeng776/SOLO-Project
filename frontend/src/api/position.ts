import request from '@/utils/request'

export interface PositionQuery {
  pageNum: number
  pageSize: number
  title?: string
  city?: string
  status?: number | string
}

export interface PositionForm {
  id?: number
  title: string
  enterpriseId: number | string
  salaryMin: number
  salaryMax: number
  city: string
  education?: string
  experience?: string
  description?: string
  status?: number | string
}

export interface PositionRecord {
  id: number
  title: string
  enterpriseId: number
  enterpriseName: string
  salaryMin: number
  salaryMax: number
  city: string
  education: string
  experience: string
  description: string
  status: number
  createTime: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export function getPositionList(params: PositionQuery) {
  return request<PageResult<PositionRecord>>({
    url: '/position/list',
    method: 'get',
    params
  })
}

export function getPositionDetail(id: number) {
  return request<PositionRecord>({
    url: `/position/${id}`,
    method: 'get'
  })
}

export function createPosition(data: PositionForm) {
  return request<void>({
    url: '/position',
    method: 'post',
    data
  })
}

export function updatePosition(data: PositionForm) {
  return request<void>({
    url: '/position',
    method: 'put',
    data
  })
}

export function removePosition(id: number) {
  return request<void>({
    url: `/position/${id}`,
    method: 'delete'
  })
}
