import request from '@/utils/request'

export function applyAfterSale(data) {
  return request({
    url: '/after-sales/apply',
    method: 'post',
    data
  })
}

export function approveAfterSale(id, data) {
  return request({
    url: `/after-sales/${id}/approve`,
    method: 'put',
    data
  })
}

export function rejectAfterSale(id, data) {
  return request({
    url: `/after-sales/${id}/reject`,
    method: 'put',
    data
  })
}

export function postponeAfterSale(id, data) {
  return request({
    url: `/after-sales/${id}/postpone`,
    method: 'put',
    data
  })
}

export function executeRefund(id) {
  return request({
    url: `/after-sales/${id}/execute-refund`,
    method: 'post'
  })
}

export function batchApprove(ids) {
  return request({
    url: '/after-sales/batch/approve',
    method: 'post',
    data: { ids }
  })
}

export function batchReject(ids, rejectReason) {
  return request({
    url: '/after-sales/batch/reject',
    method: 'post',
    data: { ids, rejectReason }
  })
}

export function batchPostpone(ids, remark) {
  return request({
    url: '/after-sales/batch/postpone',
    method: 'post',
    data: { ids, remark }
  })
}

export function traceAfterSales(params) {
  return request({
    url: '/after-sales/trace',
    method: 'get',
    params
  })
}

export function getAfterSaleDetail(id) {
  return request({
    url: `/after-sales/${id}`,
    method: 'get'
  })
}

export function listAfterSales(params) {
  return request({
    url: '/after-sales',
    method: 'get',
    params
  })
}
