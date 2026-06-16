import { get, post, put, del } from '@utils/request'
import type { ListResult, TreeNode, SelectOption } from '@types'
import type { Organization, OrganizationForm } from '@types/business'

export function getOrgTreeApi() {
  return get<TreeNode<Organization>[]>('/system/org/tree')
}

export function getOrgListApi() {
  return get<ListResult<Organization>>('/system/org/list')
}

export function getOrgOptionsApi() {
  return get<SelectOption[]>('/system/org/options')
}

export function getOrgDetailApi(id: number) {
  return get<Organization>(`/system/org/${id}`)
}

export function createOrgApi(data: OrganizationForm) {
  return post<Organization>('/system/org', data)
}

export function updateOrgApi(data: OrganizationForm) {
  return put<Organization>(`/system/org/${data.id}`, data)
}

export function deleteOrgApi(id: number) {
  return del<void>(`/system/org/${id}`)
}
