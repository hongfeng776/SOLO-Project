import request from '@/utils/request'

export function getCouponList(params) {
  return request({
    url: '/coupon/list',
    method: 'get',
    params
  })
}

export function getCoupon(id) {
  return request({
    url: `/coupon/${id}`,
    method: 'get'
  })
}

export function createCoupon(data) {
  return request({
    url: '/coupon',
    method: 'post',
    data
  })
}

export function updateCoupon(id, data) {
  return request({
    url: `/coupon/${id}`,
    method: 'put',
    data
  })
}

export function issueCoupon(id, data) {
  return request({
    url: `/coupon/${id}/issue`,
    method: 'post',
    data
  })
}

export function batchIssueCoupon(data) {
  return request({
    url: '/coupon/batch-issue',
    method: 'post',
    data
  })
}

export function revokeCoupon(id) {
  return request({
    url: `/coupon/${id}/revoke`,
    method: 'put'
  })
}
