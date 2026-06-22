import request from '@/utils/request'

export function getTicketFulfillmentList(params) {
  return request({
    url: '/ticket-fulfillment',
    method: 'get',
    params
  })
}

export function getTicketFulfillmentStats(params) {
  return request({
    url: '/ticket-fulfillment/ops/stats',
    method: 'get',
    params
  })
}

export function getTicketFulfillment(id) {
  return request({
    url: `/ticket-fulfillment/${id}`,
    method: 'get'
  })
}

export function createTicketFulfillment(data) {
  return request({
    url: '/ticket-fulfillment',
    method: 'post',
    data
  })
}

export function updateTicketFulfillment(id, data) {
  return request({
    url: `/ticket-fulfillment/${id}`,
    method: 'put',
    data
  })
}

export function verifyTicketFulfillment(ticketCode, verifyData = {}) {
  return request({
    url: '/ticket-fulfillment/ops/verify',
    method: 'post',
    data: { ticketCode, verifyData }
  })
}

export function batchTicketFulfillment(data) {
  return request({
    url: '/ticket-fulfillment/ops/batch',
    method: 'post',
    data
  })
}

export function checkFulfillmentIntegrity(id) {
  return request({
    url: `/ticket-fulfillment/${id}/ops/integrity`,
    method: 'get'
  })
}

export function checkExpiredFulfillment() {
  return request({
    url: '/ticket-fulfillment/ops/check-expired',
    method: 'post'
  })
}

export function getFulfillmentLogs(id, params) {
  return request({
    url: `/ticket-fulfillment/${id}/ops/logs`,
    method: 'get',
    params
  })
}

export function getAllFulfillmentLogs(params) {
  return request({
    url: '/ticket-fulfillment/ops/logs/all',
    method: 'get',
    params
  })
}

export function checkFulfillmentPermission(type) {
  return request({
    url: '/ticket-fulfillment/ops/permission',
    method: 'get',
    params: { type }
  })
}
