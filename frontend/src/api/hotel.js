import request from '@/utils/request'

export function getHotelList(params) {
  return request({
    url: '/hotel/list',
    method: 'get',
    params
  })
}

export function getHotel(id) {
  return request({
    url: `/hotel/${id}`,
    method: 'get'
  })
}

export function createHotel(data) {
  return request({
    url: '/hotel',
    method: 'post',
    data
  })
}

export function updateHotel(id, data) {
  return request({
    url: `/hotel/${id}`,
    method: 'put',
    data
  })
}

export function deleteHotel(id) {
  return request({
    url: `/hotel/${id}`,
    method: 'delete'
  })
}

export function batchDeleteHotel(ids) {
  return request({
    url: '/hotel/batch',
    method: 'delete',
    data: { ids }
  })
}
