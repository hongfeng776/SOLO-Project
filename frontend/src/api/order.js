import request from '@/utils/request'

export function getOrderList(params) {
  return request({
    url: '/order/list',
    method: 'get',
    params
  })
}

export function getOrder(id) {
  return request({
    url: `/order/${id}`,
    method: 'get'
  })
}

export function createOrder(data) {
  return request({
    url: '/order',
    method: 'post',
    data
  })
}

export function updateOrder(id, data) {
  return request({
    url: `/order/${id}`,
    method: 'put',
    data
  })
}

export function deleteOrder(id) {
  return request({
    url: `/order/${id}`,
    method: 'delete'
  })
}

export function batchDeleteOrder(ids) {
  return request({
    url: '/order/batch',
    method: 'delete',
    data: { ids }
  })
}

export function cancelOrder(id) {
  return request({
    url: `/order/${id}/cancel`,
    method: 'put'
  })
}

export function refundOrder(id) {
  return request({
    url: `/order/${id}/refund`,
    method: 'put'
  })
}

export function getOrderEditDetail(id) {
  return request({
    url: `/api/orders/${id}/edit`,
    method: 'get'
  })
}

export function validateOrderEdit(id, data) {
  return request({
    url: `/api/orders/${id}/validate`,
    method: 'post',
    data
  })
}

export function updateOrderInfo(id, data) {
  return request({
    url: `/api/orders/${id}/info`,
    method: 'put',
    data
  })
}

export function updateOrderStatus(id, data) {
  return request({
    url: `/api/orders/${id}/status`,
    method: 'put',
    data
  })
}

export function resetOrderStatus(id) {
  return request({
    url: `/api/orders/${id}/reset`,
    method: 'put'
  })
}

export function batchConfirmFulfill(ids) {
  return request({
    url: `/api/orders/batch/confirm`,
    method: 'post',
    data: { ids }
  })
}

export function batchMarkAbnormal(ids, reason) {
  return request({
    url: `/api/orders/batch/abnormal`,
    method: 'post',
    data: { ids, reason }
  })
}

export function batchArchive(ids) {
  return request({
    url: `/api/orders/batch/archive`,
    method: 'post',
    data: { ids }
  })
}

export function traceOrder(keyword) {
  return request({
    url: `/api/orders/trace`,
    method: 'get',
    params: { keyword }
  })
}
