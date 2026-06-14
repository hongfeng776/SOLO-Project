import request from '@/utils/request'

export interface EnterpriseQuery {
  pageNum: number
  pageSize: number
  name?: string
  industry?: string
  entryTimeStart?: string
  entryTimeEnd?: string
}

export interface EnterpriseForm {
  id?: number
  name: string
  unifiedCode: string
  contactName: string
  contactPhone: string
  email: string
  address: string
  industry: string
  scale: string
  licenseNo: string
  licenseType: string
  legalPerson: string
  registeredCapital: string
  establishedDate: string
  businessScope: string
  qualificationName: string
  qualificationNo: string
  qualificationExpiry: string
  status: number | string
}

export interface EnterpriseRecord {
  id: number
  name: string
  unifiedCode: string
  contactName: string
  contactPhone: string
  email: string
  address: string
  industry: string
  scale: string
  licenseNo: string
  licenseType: string
  legalPerson: string
  registeredCapital: string
  establishedDate: string
  businessScope: string
  qualificationName: string
  qualificationNo: string
  qualificationExpiry: string
  status: number
  entryTime: string
  createTime: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export function getEnterpriseList(params: EnterpriseQuery) {
  return request<PageResult<EnterpriseRecord>>({
    url: '/enterprise/list',
    method: 'get',
    params
  })
}

export function getEnterpriseDetail(id: number) {
  return request<EnterpriseRecord>({
    url: `/enterprise/${id}`,
    method: 'get'
  })
}

export function createEnterprise(data: EnterpriseForm) {
  return request<void>({
    url: '/enterprise',
    method: 'post',
    data
  })
}

export function updateEnterprise(data: EnterpriseForm) {
  return request<void>({
    url: `/enterprise/${data.id}`,
    method: 'put',
    data
  })
}

export function removeEnterprise(id: number) {
  return request<void>({
    url: `/enterprise/${id}`,
    method: 'delete'
  })
}
