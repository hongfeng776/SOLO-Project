import request from '@/utils/request'

export function getBusinessTravelList(params) {
  return request({
    url: '/business-travel/list',
    method: 'get',
    params
  })
}

export function getBusinessTravel(id) {
  return request({
    url: `/business-travel/${id}`,
    method: 'get'
  })
}

export function createBusinessTravel(data) {
  return request({
    url: '/business-travel',
    method: 'post',
    data
  })
}

export function updateBusinessTravel(id, data) {
  return request({
    url: `/business-travel/${id}`,
    method: 'put',
    data
  })
}

export function confirmBusinessTravel(id) {
  return request({
    url: `/business-travel/${id}/confirm`,
    method: 'put'
  })
}

export function cancelBusinessTravel(id) {
  return request({
    url: `/business-travel/${id}/cancel`,
    method: 'put'
  })
}
