import request from '@/utils/request'

export function initiatePayment(data) {
  return request({
    url: '/api/payments/initiate',
    method: 'post',
    data
  })
}

export function confirmPayment(flowId, data) {
  return request({
    url: `/api/payments/${flowId}/confirm`,
    method: 'put',
    data
  })
}

export function failPayment(flowId, data) {
  return request({
    url: `/api/payments/${flowId}/fail`,
    method: 'put',
    data
  })
}

export function batchRemindPayment(ids) {
  return request({
    url: '/api/payments/batch/remind',
    method: 'post',
    data: { ids }
  })
}

export function batchCancelTimeout(ids) {
  return request({
    url: '/api/payments/batch/cancel-timeout',
    method: 'post',
    data: { ids }
  })
}

export function batchExemptTimeout(ids) {
  return request({
    url: '/api/payments/batch/exempt-timeout',
    method: 'post',
    data: { ids }
  })
}

export function tracePaymentFlows(params) {
  return request({
    url: '/api/payments/trace',
    method: 'get',
    params
  })
}

export function getFlowDetail(flowId) {
  return request({
    url: `/api/payments/${flowId}`,
    method: 'get'
  })
}

export function getOrderFlows(orderId) {
  return request({
    url: `/api/payments/order/${orderId}`,
    method: 'get'
  })
}
