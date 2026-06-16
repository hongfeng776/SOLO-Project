import request from '@/utils/request'

export function getCarList(params) {
  return request({
    url: '/car/list',
    method: 'get',
    params
  })
}

export function getCar(id) {
  return request({
    url: `/car/${id}`,
    method: 'get'
  })
}

export function createCar(data) {
  return request({
    url: '/car',
    method: 'post',
    data
  })
}

export function updateCar(id, data) {
  return request({
    url: `/car/${id}`,
    method: 'put',
    data
  })
}

export function deleteCar(id) {
  return request({
    url: `/car/${id}`,
    method: 'delete'
  })
}

export function batchDeleteCar(ids) {
  return request({
    url: '/car/batch',
    method: 'delete',
    data: { ids }
  })
}
