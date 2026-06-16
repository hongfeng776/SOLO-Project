import request from '@/utils/request'

export function getOverviewStats() {
  return request({
    url: '/statistics/overview',
    method: 'get'
  })
}

export function getOrderStats(params) {
  return request({
    url: '/statistics/order',
    method: 'get',
    params
  })
}

export function getMerchantStats(params) {
  return request({
    url: '/statistics/merchant',
    method: 'get',
    params
  })
}

export function getInventoryStats() {
  return request({
    url: '/statistics/inventory',
    method: 'get'
  })
}

export function getCouponStats() {
  return request({
    url: '/statistics/coupon',
    method: 'get'
  })
}

export function getCategoryRanking(params) {
  return request({
    url: '/statistics/category-ranking',
    method: 'get',
    params
  })
}

export function getSalesTrend(params) {
  return request({
    url: '/statistics/sales-trend',
    method: 'get',
    params
  })
}
