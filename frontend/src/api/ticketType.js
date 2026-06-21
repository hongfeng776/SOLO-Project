import request from '@/utils/request'

export function getTicketTypeList(params) {
  return request({
    url: '/ticket-types',
    method: 'get',
    params
  })
}

export function getTicketType(id) {
  return request({
    url: `/ticket-types/${id}`,
    method: 'get'
  })
}

export function createTicketType(data) {
  return request({
    url: '/ticket-types',
    method: 'post',
    data
  })
}

export function updateTicketType(id, data) {
  return request({
    url: `/ticket-types/${id}`,
    method: 'put',
    data
  })
}

export function deleteTicketType(id) {
  return request({
    url: `/ticket-types/${id}`,
    method: 'delete'
  })
}

export function changeTicketTypeStatus(id, status, reason) {
  return request({
    url: `/ticket-types/${id}/ops/status`,
    method: 'put',
    data: { status, reason }
  })
}

export function setTicketTypeEnabled(id, enabled, reason) {
  return request({
    url: `/ticket-types/${id}/ops/enabled`,
    method: 'put',
    data: { enabled, reason }
  })
}

export function batchTicketTypeOperation(data) {
  return request({
    url: '/ticket-types/ops/batch',
    method: 'post',
    data
  })
}

export function getTicketTypeLogs(id, params) {
  return request({
    url: `/ticket-types/${id}/ops/logs`,
    method: 'get',
    params
  })
}

export function getAllTicketTypeLogs(params) {
  return request({
    url: '/ticket-types/ops/logs/all',
    method: 'get',
    params
  })
}

export function verifyTicketType(id, verifyType, reason) {
  return request({
    url: `/ticket-types/${id}/ops/verify`,
    method: 'post',
    data: { verifyType, reason }
  })
}

export function checkTicketTypePermission(type) {
  return request({
    url: '/ticket-types/ops/permission',
    method: 'get',
    params: { type }
  })
}
