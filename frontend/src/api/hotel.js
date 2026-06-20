import request from '@/utils/request'

export function getHotelList(params) {
  return request({
    url: '/hotels',
    method: 'get',
    params
  })
}

export function getHotel(id) {
  return request({
    url: `/hotels/${id}`,
    method: 'get'
  })
}

export function createHotel(data) {
  return request({
    url: '/hotels',
    method: 'post',
    data
  })
}

export function updateHotel(id, data) {
  return request({
    url: `/hotels/${id}`,
    method: 'put',
    data
  })
}

export function deleteHotel(id) {
  return request({
    url: `/hotels/${id}`,
    method: 'delete'
  })
}

export function batchDeleteHotel(ids) {
  return request({
    url: '/hotels/batch',
    method: 'delete',
    data: { ids }
  })
}

export function checkHotelPermission(type) {
  return request({
    url: '/hotels/ops/permission',
    method: 'get',
    params: { type }
  })
}

export function changeHotelStatus(id, status, reason) {
  return request({
    url: `/hotels/${id}/ops/status`,
    method: 'put',
    data: { status, reason }
  })
}

export function batchHotelOperation(params) {
  return request({
    url: '/hotels/ops/batch',
    method: 'post',
    data: params
  })
}

export function getHotelLogs(id, params) {
  return request({
    url: `/hotels/${id}/ops/logs`,
    method: 'get',
    params
  })
}

export function getAllHotelLogs(params) {
  return request({
    url: '/hotels/ops/logs/all',
    method: 'get',
    params
  })
}

export function verifyHotel(id, verifyType) {
  return request({
    url: `/hotels/${id}/ops/verify`,
    method: 'post',
    data: { verifyType }
  })
}
