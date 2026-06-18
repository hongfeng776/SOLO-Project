import request from '@/utils/request'

export function getBenefitList(params) {
  return request({
    url: '/benefits',
    method: 'get',
    params
  })
}

export function getBenefitStats(params) {
  return request({
    url: '/benefits/stats/summary',
    method: 'get',
    params
  })
}

export function validateBenefit(data) {
  return request({
    url: '/benefits/validate',
    method: 'post',
    data
  })
}

export function grantBenefit(data) {
  return request({
    url: '/benefits/grant',
    method: 'post',
    data
  })
}

export function reissueBenefit(id, data) {
  return request({
    url: `/benefits/${id}/reissue`,
    method: 'post',
    data
  })
}

export function voidBenefit(id, data) {
  return request({
    url: `/benefits/${id}/void`,
    method: 'post',
    data
  })
}

export function extendBenefit(id, data) {
  return request({
    url: `/benefits/${id}/extend`,
    method: 'post',
    data
  })
}

export function recycleBenefit(id, data) {
  return request({
    url: `/benefits/${id}/recycle`,
    method: 'post',
    data
  })
}

export function batchGrantBenefit(data) {
  return request({
    url: '/benefits/batch/grant',
    method: 'post',
    data
  })
}

export function batchExtendBenefit(data) {
  return request({
    url: '/benefits/batch/extend',
    method: 'post',
    data
  })
}

export function batchRecycleBenefit(data) {
  return request({
    url: '/benefits/batch/recycle',
    method: 'post',
    data
  })
}

export function getBenefitTrace(userId, params) {
  return request({
    url: `/benefits/trace/${userId}`,
    method: 'get',
    params
  })
}

export function checkExpiredBenefits() {
  return request({
    url: '/benefits/check-expired',
    method: 'post'
  })
}
