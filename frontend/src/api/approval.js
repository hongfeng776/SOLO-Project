import request from '@/utils/request'

export function getApprovalList(params) {
  return request({
    url: '/approval/list',
    method: 'get',
    params
  })
}

export function getApproval(id) {
  return request({
    url: `/approval/${id}`,
    method: 'get'
  })
}

export function approveApproval(id, data) {
  return request({
    url: `/approval/${id}/approve`,
    method: 'put',
    data
  })
}

export function rejectApproval(id, data) {
  return request({
    url: `/approval/${id}/reject`,
    method: 'put',
    data
  })
}
