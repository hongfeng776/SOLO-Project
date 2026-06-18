import request from '@/utils/request'

export function getPermissionTree() {
  return request({
    url: '/permissions/tree',
    method: 'get'
  })
}

export function getPermissionTemplates() {
  return request({
    url: '/permissions/templates',
    method: 'get'
  })
}

export function getUserPermissions(userId) {
  return request({
    url: `/permissions/user/${userId}`,
    method: 'get'
  })
}

export function saveUserPermission(userId, permissionData) {
  return request({
    url: `/permissions/user/${userId}`,
    method: 'post',
    data: { permissionData }
  })
}

export function validatePermissions(userId, permissionMap) {
  return request({
    url: '/permissions/validate',
    method: 'post',
    data: { userId, permissionMap }
  })
}

export function batchApplyPermissionTemplate(userIds, templateKey, reason) {
  return request({
    url: '/permissions/batch/template',
    method: 'post',
    data: { userIds, templateKey, reason }
  })
}

export function batchTogglePermissions(userIds, permissionKeys, enable, reason) {
  return request({
    url: '/permissions/batch/toggle',
    method: 'post',
    data: { userIds, permissionKeys, enable, reason }
  })
}

export function batchResetPermissions(userIds, reason) {
  return request({
    url: '/permissions/batch/reset',
    method: 'post',
    data: { userIds, reason }
  })
}

export function getPermissionLogs(params) {
  return request({
    url: '/permissions/logs',
    method: 'get',
    params
  })
}

export function detectPermissionAbnormal(userId) {
  return request({
    url: `/permissions/abnormal/${userId}`,
    method: 'get'
  })
}
