import request from '@/utils/request'

export function getTicketInventoryList(params) {
  return request({
    url: '/ticket-inventory',
    method: 'get',
    params
  })
}

export function getTicketInventoryStats(params) {
  return request({
    url: '/ticket-inventory/ops/stats',
    method: 'get',
    params
  })
}

export function getTicketInventory(id) {
  return request({
    url: `/ticket-inventory/${id}`,
    method: 'get'
  })
}

export function createTicketInventory(data) {
  return request({
    url: '/ticket-inventory',
    method: 'post',
    data
  })
}

export function updateTicketInventory(id, data) {
  return request({
    url: `/ticket-inventory/${id}`,
    method: 'put',
    data
  })
}

export function deleteTicketInventory(id) {
  return request({
    url: `/ticket-inventory/${id}`,
    method: 'delete'
  })
}

export function setInventoryStatus(id, status, reason) {
  return request({
    url: `/ticket-inventory/${id}/ops/status`,
    method: 'put',
    data: { status, reason }
  })
}

export function batchInventoryOperation(data) {
  return request({
    url: '/ticket-inventory/ops/batch',
    method: 'post',
    data
  })
}

export function verifyInventory(id, verifyType, reason) {
  return request({
    url: `/ticket-inventory/${id}/ops/verify`,
    method: 'post',
    data: { verifyType, reason }
  })
}

export function checkExpiredInventory() {
  return request({
    url: '/ticket-inventory/ops/check-expired',
    method: 'post'
  })
}

export function getInventoryLogs(id, params) {
  return request({
    url: `/ticket-inventory/${id}/ops/logs`,
    method: 'get',
    params
  })
}

export function getAllInventoryLogs(params) {
  return request({
    url: '/ticket-inventory/ops/logs/all',
    method: 'get',
    params
  })
}

export function checkInventoryPermission(type) {
  return request({
    url: '/ticket-inventory/ops/permission',
    method: 'get',
    params: { type }
  })
}
