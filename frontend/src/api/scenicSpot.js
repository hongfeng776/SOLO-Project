import request from '@/utils/request'

export function getScenicSpotList(params) {
  return request({
    url: '/scenic-spots',
    method: 'get',
    params
  })
}

export function getScenicSpot(id) {
  return request({
    url: `/scenic-spots/${id}`,
    method: 'get'
  })
}

export function createScenicSpot(data) {
  return request({
    url: '/scenic-spots',
    method: 'post',
    data
  })
}

export function updateScenicSpot(id, data) {
  return request({
    url: `/scenic-spots/${id}`,
    method: 'put',
    data
  })
}

export function deleteScenicSpot(id) {
  return request({
    url: `/scenic-spots/${id}`,
    method: 'delete'
  })
}

export function changeScenicSpotStatus(id, status, reason) {
  return request({
    url: `/scenic-spots/${id}/ops/status`,
    method: 'put',
    data: { status, reason }
  })
}

export function batchScenicSpotOperation(data) {
  return request({
    url: '/scenic-spots/ops/batch',
    method: 'post',
    data
  })
}

export function getScenicSpotLogs(id, params) {
  return request({
    url: `/scenic-spots/${id}/ops/logs`,
    method: 'get',
    params
  })
}

export function getAllScenicSpotLogs(params) {
  return request({
    url: '/scenic-spots/ops/logs/all',
    method: 'get',
    params
  })
}

export function verifyScenicSpot(id, verifyType) {
  return request({
    url: `/scenic-spots/${id}/ops/verify`,
    method: 'post',
    data: { verifyType }
  })
}

export function checkScenicSpotPermission(type) {
  return request({
    url: '/scenic-spots/ops/permission',
    method: 'get',
    params: { type }
  })
}
