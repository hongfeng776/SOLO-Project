import request from '@/utils/request'

export interface SeekerQuery {
  pageNum: number
  pageSize: number
  name?: string
  gender?: number
  education?: string
  status?: number
  startTime?: string
  endTime?: string
}

export interface SeekerForm {
  id?: number
  name: string
  gender: number | string
  age: number
  phone: string
  email?: string
  education?: string
  workYears?: number
  jobIntention?: string
  expectedSalary?: string
  expectedCity?: string
  status?: number | string
}

export interface SeekerRecord {
  id: number
  name: string
  gender: number
  age: number
  phone: string
  email: string
  education: string
  workYears: number
  jobIntention: string
  expectedSalary: string
  expectedCity: string
  status: number
  createTime: string
  updateTime: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export function getSeekerList(params: SeekerQuery) {
  return request<PageResult<SeekerRecord>>({
    url: '/seeker/list',
    method: 'get',
    params
  })
}

export function getSeekerDetail(id: number) {
  return request<SeekerRecord>({
    url: `/seeker/${id}`,
    method: 'get'
  })
}

export function createSeeker(data: SeekerForm) {
  return request<void>({
    url: '/seeker',
    method: 'post',
    data
  })
}

export function updateSeeker(data: SeekerForm) {
  return request<void>({
    url: `/seeker/${data.id}`,
    method: 'put',
    data
  })
}

export function removeSeeker(id: number) {
  return request<void>({
    url: `/seeker/${id}`,
    method: 'delete'
  })
}

export function batchRemoveSeeker(ids: number[]) {
  return request<void>({
    url: '/seeker/batch',
    method: 'delete',
    data: { ids }
  })
}
