import request from '@/utils/request'

export function getMerchantList(params) {
  return request({
    url: '/merchant/list',
    method: 'get',
    params
  })
}

export function getMerchant(id) {
  return request({
    url: `/merchant/${id}`,
    method: 'get'
  })
}

export function createMerchant(data) {
  return request({
    url: '/merchant',
    method: 'post',
    data
  })
}

export function updateMerchant(id, data) {
  return request({
    url: `/merchant/${id}`,
    method: 'put',
    data
  })
}

export function deleteMerchant(id) {
  return request({
    url: `/merchant/${id}`,
    method: 'delete'
  })
}

export function batchDeleteMerchant(ids) {
  return request({
    url: '/merchant/batch',
    method: 'delete',
    data: { ids }
  })
}

export function auditMerchant(id, status, remark) {
  return request({
    url: `/merchant/${id}/audit`,
    method: 'put',
    data: { status, remark }
  })
}
