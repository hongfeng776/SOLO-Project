import request from '@/utils/request'

export function getFlightList(params) {
  return request({
    url: '/flight/list',
    method: 'get',
    params
  })
}

export function getFlight(id) {
  return request({
    url: `/flight/${id}`,
    method: 'get'
  })
}

export function createFlight(data) {
  return request({
    url: '/flight',
    method: 'post',
    data
  })
}

export function updateFlight(id, data) {
  return request({
    url: `/flight/${id}`,
    method: 'put',
    data
  })
}

export function deleteFlight(id) {
  return request({
    url: `/flight/${id}`,
    method: 'delete'
  })
}

export function batchDeleteFlight(ids) {
  return request({
    url: '/flight/batch',
    method: 'delete',
    data: { ids }
  })
}
