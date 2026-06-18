import request from '@/utils/request'

export function getBehaviorList(params) {
  return request({
    url: '/behaviors',
    method: 'get',
    params
  })
}

export function getBehaviorStats(params) {
  return request({
    url: '/behaviors/stats/summary',
    method: 'get',
    params
  })
}

export function getUserBehaviorTrace(userId, params) {
  return request({
    url: `/behaviors/trace/${userId}`,
    method: 'get',
    params
  })
}

export function detectUserRisk(userId) {
  return request({
    url: `/behaviors/detect-risk/${userId}`,
    method: 'post'
  })
}

export function getRiskUserList(params) {
  return request({
    url: '/behaviors/risks/list',
    method: 'get',
    params
  })
}

export function batchMarkRiskUser(userIds, riskLevel, remark) {
  return request({
    url: '/behaviors/batch/mark',
    method: 'post',
    data: { userIds, riskLevel, remark }
  })
}

export function batchSendRiskWarning(userIds, content) {
  return request({
    url: '/behaviors/batch/warning',
    method: 'post',
    data: { userIds, content }
  })
}

export function batchRestrictUser(userIds, restrictType, reason) {
  return request({
    url: '/behaviors/batch/restrict',
    method: 'post',
    data: { userIds, restrictType, reason }
  })
}
