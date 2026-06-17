import request from '@/utils/request'

export function getUserList(params) {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

export function getUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'get'
  })
}

export function createUser(data) {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}

export function batchDeleteUser(ids) {
  return request({
    url: '/users/batch',
    method: 'delete',
    data: { ids }
  })
}

export function traceUser(params) {
  return request({
    url: '/users/trace/search',
    method: 'get',
    params
  })
}

export function validateUniqueness(params) {
  return request({
    url: '/users/validate/uniqueness',
    method: 'get',
    params
  })
}

export function updateUserStatus(id, status, reason) {
  return request({
    url: `/users/${id}/status`,
    method: 'put',
    data: { status, reason }
  })
}

export function batchUpdateUserStatus(ids, status, reason) {
  return request({
    url: '/users/batch/status',
    method: 'post',
    data: { ids, status, reason }
  })
}

export function batchUpdateUserInfo(ids, updateData) {
  return request({
    url: '/users/batch/info',
    method: 'post',
    data: { ids, updateData }
  })
}

export function batchFreezeUser(ids, reason) {
  return request({
    url: '/users/batch/freeze',
    method: 'post',
    data: { ids, reason }
  })
}

export function batchUnfreezeUser(ids) {
  return request({
    url: '/users/batch/unfreeze',
    method: 'post',
    data: { ids }
  })
}
