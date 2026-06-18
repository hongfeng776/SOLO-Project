import request from '@/utils/request'

export function getFlightList(params) {
  return request({
    url: '/flights',
    method: 'get',
    params
  })
}

export function getFlight(id) {
  return request({
    url: `/flights/${id}`,
    method: 'get'
  })
}

export function createFlight(data) {
  return request({
    url: '/flights',
    method: 'post',
    data
  })
}

export function updateFlight(id, data) {
  return request({
    url: `/flights/${id}`,
    method: 'put',
    data
  })
}

export function deleteFlight(id) {
  return request({
    url: `/flights/${id}`,
    method: 'delete'
  })
}

export function batchDeleteFlight(ids) {
  return request({
    url: '/flights/batch',
    method: 'delete',
    data: { ids }
  })
}

export function validateFlightData(data, id) {
  return request({
    url: id ? `/flights/validate/${id}` : '/flights/validate',
    method: 'post',
    data
  })
}

export function validateFlightField(field, value, id) {
  return request({
    url: '/flights/validate/field',
    method: 'get',
    params: { field, value, id }
  })
}

export function updateFlightOperationStatus(id, operationStatus, extraData = {}) {
  return request({
    url: `/flights/${id}/operation-status`,
    method: 'put',
    data: { operationStatus, ...extraData }
  })
}

export function updateFlightDisplayStatus(id, displayStatus) {
  return request({
    url: `/flights/${id}/display-status`,
    method: 'put',
    data: { displayStatus }
  })
}

export function batchUpdateFlightTime(ids, timeData) {
  return request({
    url: '/flights/batch/time',
    method: 'post',
    data: { ids, timeData }
  })
}

export function batchUpdateFlightDisplayStatus(ids, displayStatus) {
  return request({
    url: '/flights/batch/display-status',
    method: 'post',
    data: { ids, displayStatus }
  })
}

export function batchOfflineAbnormalFlights(ids) {
  return request({
    url: '/flights/batch/offline-abnormal',
    method: 'post',
    data: { ids }
  })
}

export function getFlightLogs(id, params) {
  return request({
    url: `/flights/${id}/logs`,
    method: 'get',
    params
  })
}

export function getFlightStats() {
  return request({
    url: '/flights/stats/summary',
    method: 'get'
  })
}
