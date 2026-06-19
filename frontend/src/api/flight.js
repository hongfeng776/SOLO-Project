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

export function getFlightPriceList(params) {
  return request({
    url: '/flight-prices',
    method: 'get',
    params
  })
}

export function getFlightPrice(id) {
  return request({
    url: `/flight-prices/${id}`,
    method: 'get'
  })
}

export function createFlightPrice(data) {
  return request({
    url: '/flight-prices',
    method: 'post',
    data
  })
}

export function updateFlightPrice(id, data) {
  return request({
    url: `/flight-prices/${id}`,
    method: 'put',
    data
  })
}

export function deleteFlightPrice(id) {
  return request({
    url: `/flight-prices/${id}`,
    method: 'delete'
  })
}

export function validateFlightPrice(data) {
  return request({
    url: '/flight-prices/validate',
    method: 'post',
    data
  })
}

export function validateFlightPriceField(fieldName, value, params) {
  return request({
    url: '/flight-prices/validate/field',
    method: 'get',
    params: { fieldName, value, ...params }
  })
}

export function updateFlightPriceDisplayStatus(id, isActive) {
  return request({
    url: `/flight-prices/${id}/display-status`,
    method: 'put',
    data: { isActive }
  })
}

export function batchUpdateFlightPriceTime(data) {
  return request({
    url: '/flight-prices/batch/time',
    method: 'post',
    data
  })
}

export function batchUpdateFlightPrice(data) {
  return request({
    url: '/flight-prices/batch/price',
    method: 'post',
    data
  })
}

export function batchUpdateFlightPriceDisplayStatus(priceIds, isActive) {
  return request({
    url: '/flight-prices/batch/display-status',
    method: 'post',
    data: { priceIds, isActive }
  })
}

export function getFlightPriceLogs(id, params) {
  return request({
    url: `/flight-prices/${id}/logs`,
    method: 'get',
    params
  })
}

export function getFlightPriceStats(params) {
  return request({
    url: '/flight-prices/stats/summary',
    method: 'get',
    params
  })
}

export function getFlightInventoryList(params) {
  return request({
    url: '/flight-inventories',
    method: 'get',
    params
  })
}

export function getFlightInventory(id) {
  return request({
    url: `/flight-inventories/${id}`,
    method: 'get'
  })
}

export function createFlightInventory(data) {
  return request({
    url: '/flight-inventories',
    method: 'post',
    data
  })
}

export function updateFlightInventory(id, data) {
  return request({
    url: `/flight-inventories/${id}`,
    method: 'put',
    data
  })
}

export function deleteFlightInventory(id) {
  return request({
    url: `/flight-inventories/${id}`,
    method: 'delete'
  })
}

export function validateFlightInventory(data) {
  return request({
    url: '/flight-inventories/validate',
    method: 'post',
    data
  })
}

export function validateFlightInventoryField(fieldName, value, params) {
  return request({
    url: '/flight-inventories/validate/field',
    method: 'get',
    params: { fieldName, value, ...params }
  })
}

export function lockFlightInventory(id, lockQuantity) {
  return request({
    url: `/flight-inventories/${id}/lock`,
    method: 'post',
    data: { lockQuantity }
  })
}

export function unlockFlightInventory(id, unlockQuantity) {
  return request({
    url: `/flight-inventories/${id}/unlock`,
    method: 'post',
    data: { unlockQuantity }
  })
}

export function releaseFlightInventoryReservation(id, releaseQuantity) {
  return request({
    url: `/flight-inventories/${id}/release-reservation`,
    method: 'post',
    data: { releaseQuantity }
  })
}

export function batchLockFlightInventory(ids, lockQuantity) {
  return request({
    url: '/flight-inventories/batch/lock',
    method: 'post',
    data: { ids, lockQuantity }
  })
}

export function batchUnlockFlightInventory(ids, unlockQuantity) {
  return request({
    url: '/flight-inventories/batch/unlock',
    method: 'post',
    data: { ids, unlockQuantity }
  })
}

export function batchSupplementFlightInventory(ids, supplementQuantity, isHolidayBatch) {
  return request({
    url: '/flight-inventories/batch/supplement',
    method: 'post',
    data: { ids, supplementQuantity, isHolidayBatch }
  })
}

export function batchReleaseExpiredReservation() {
  return request({
    url: '/flight-inventories/batch/release-expired',
    method: 'post'
  })
}

export function getFlightInventoryLogs(params) {
  return request({
    url: '/flight-inventories/logs',
    method: 'get',
    params
  })
}

export function getFlightInventoryStats(params) {
  return request({
    url: '/flight-inventories/stats/summary',
    method: 'get',
    params
  })
}
