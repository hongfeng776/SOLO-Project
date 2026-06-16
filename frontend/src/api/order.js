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
