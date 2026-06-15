import request from '@/utils/request'

export interface PositionQuery {
  pageNum: number
  pageSize: number
  title?: string
  enterpriseId?: number | string
  category?: string
  city?: string
  status?: number | string
}

export interface PositionForm {
  id?: number
  title: string
  enterpriseId: number | string
  category: string
  salaryMin: number
  salaryMax: number
  city: string
  education?: string
  experience?: string
  responsibility?: string
  requirement?: string
  expireTime?: string
  status?: number | string
}

export interface PositionRecord {
  id: number
  title: string
  enterpriseId: number
  enterpriseName: string
  category: string
  salaryMin: number
  salaryMax: number
  city: string
  education: string
  experience: string
  responsibility: string
  requirement: string
  viewCount: number
  applyCount: number
  status: number
  expireTime: string
  createTime: string
  updateTime: string
}

export interface ResumeRecordVO {
  id: number
  seekerId: number
  seekerName: string
  positionTitle: string
  enterpriseName: string
  status: number
  statusText: string
  remark: string
  applyTime: string
}

export interface PositionDetailVO extends PositionRecord {
  resumeList: ResumeRecordVO[]
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

export function getPositionDetailVO(id: number) {
  return request<PositionDetailVO>({
    url: `/position/detail/${id}`,
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
    url: `/position/${data.id}`,
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

export function removePositionBatch(ids: number[]) {
  return request<void>({
    url: '/position/batch',
    method: 'delete',
    data: { ids }
  })
}

export function updatePositionStatus(ids: number[], status: number) {
  return request<void>({
    url: '/position/status',
    method: 'put',
    data: { ids, status }
  })
}

export function onlinePosition(id: number) {
  return request<void>({
    url: `/position/online/${id}`,
    method: 'put'
  })
}

export function offlinePosition(id: number) {
  return request<void>({
    url: `/position/offline/${id}`,
    method: 'put'
  })
}
