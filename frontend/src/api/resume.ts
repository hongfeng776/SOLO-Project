import request from '@/utils/request'

export interface ResumeQuery {
  pageNum: number
  pageSize: number
  seekerName?: string
  positionId?: number | string
  status?: number | string
}

export interface ResumeForm {
  id?: number
  seekerId: number | string
  positionId: number | string
  status: number | string
  remark?: string
}

export interface ResumeRecord {
  id: number
  seekerId: number
  seekerName: string
  positionId: number
  positionName: string
  enterpriseName: string
  status: number
  remark: string
  createTime: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export function getResumeList(params: ResumeQuery) {
  return request<PageResult<ResumeRecord>>({
    url: '/resume/list',
    method: 'get',
    params
  })
}

export function getResumeDetail(id: number) {
  return request<ResumeRecord>({
    url: `/resume/${id}`,
    method: 'get'
  })
}

export function createResume(data: ResumeForm) {
  return request<void>({
    url: '/resume',
    method: 'post',
    data
  })
}

export function updateResume(data: ResumeForm) {
  return request<void>({
    url: '/resume',
    method: 'put',
    data
  })
}

export function removeResume(id: number) {
  return request<void>({
    url: `/resume/${id}`,
    method: 'delete'
  })
}
