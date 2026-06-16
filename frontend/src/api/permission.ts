import { get, post, put, del } from '@utils/request'
import type { ListResult, TreeNode } from '@types'
import type { Permission, PermissionForm } from '@types/business'

export function getPermissionTreeApi() {
  return get<TreeNode<Permission>[]>('/system/permission/tree')
}

export function getPermissionListApi() {
  return get<ListResult<Permission>>('/system/permission/list')
}

export function getPermissionDetailApi(id: number) {
  return get<Permission>(`/system/permission/${id}`)
}

export function createPermissionApi(data: PermissionForm) {
  return post<Permission>('/system/permission', data)
}

export function updatePermissionApi(data: PermissionForm) {
  return put<Permission>(`/system/permission/${data.id}`, data)
}

export function deletePermissionApi(id: number) {
  return del<void>(`/system/permission/${id}`)
}
