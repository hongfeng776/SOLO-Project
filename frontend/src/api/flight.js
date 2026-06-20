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

export function updateFlightInventoryActiveStatus(id, isActive) {
  return request({
    url: `/flight-inventories/${id}/active-status`,
    method: 'put',
    data: { isActive }
  })
}

export function lockFlightInventory(id, lockReason) {
  return request({
    url: `/flight-inventories/${id}/lock`,
    method: 'put',
    data: { lockReason }
  })
}

export function unlockFlightInventory(id) {
  return request({
    url: `/flight-inventories/${id}/unlock`,
    method: 'put'
  })
}

export function batchLockFlightInventory(inventoryIds, lockReason) {
  return request({
    url: '/flight-inventories/batch/lock',
    method: 'post',
    data: { inventoryIds, lockReason }
  })
}

export function batchUnlockFlightInventory(inventoryIds) {
  return request({
    url: '/flight-inventories/batch/unlock',
    method: 'post',
    data: { inventoryIds }
  })
}

export function batchReleaseFlightReservations(inventoryIds) {
  return request({
    url: '/flight-inventories/batch/release-reservations',
    method: 'post',
    data: { inventoryIds }
  })
}

export function batchSupplementFlightInventory(inventoryIds, supplementQuantity, supplementSource, supplementRemark) {
  return request({
    url: '/flight-inventories/batch/supplement',
    method: 'post',
    data: { inventoryIds, supplementQuantity, supplementSource, supplementRemark }
  })
}

export function batchUpdateFlightInventoryActiveStatus(inventoryIds, isActive) {
  return request({
    url: '/flight-inventories/batch/active-status',
    method: 'post',
    data: { inventoryIds, isActive }
  })
}

export function getFlightInventoryLogs(id, params) {
  const url = id ? `/flight-inventories/${id}/logs` : '/flight-inventories/logs/all'
  return request({
    url,
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

export function releaseExpiredFlightReservations() {
  return request({
    url: '/flight-inventories/release-expired',
    method: 'post'
  })
}

export function checkFlightLowStockWarning() {
  return request({
    url: '/flight-inventories/warnings/low-stock',
    method: 'get'
  })
}

export function getFlightFulfillmentList(params) {
  return request({
    url: '/flight-fulfillments',
    method: 'get',
    params
  })
}

export function getFlightFulfillment(id) {
  return request({
    url: `/flight-fulfillments/${id}`,
    method: 'get'
  })
}

export function validateFlightFulfillment(data) {
  return request({
    url: '/flight-fulfillments/validate',
    method: 'post',
    data
  })
}

export function validateFlightFulfillmentField(fieldName, value, fulfillmentId) {
  return request({
    url: '/flight-fulfillments/validate/field',
    method: 'get',
    params: { fieldName, value, fulfillmentId }
  })
}

export function createFlightFulfillment(orderId, data) {
  return request({
    url: `/flight-fulfillments/${orderId}`,
    method: 'post',
    data
  })
}

export function auditFlightFulfillment(id, auditResult, remark) {
  return request({
    url: `/flight-fulfillments/${id}/audit`,
    method: 'put',
    data: { auditResult, remark }
  })
}

export function issueFlightFulfillmentTicket(id, data) {
  return request({
    url: `/flight-fulfillments/${id}/issue-ticket`,
    method: 'put',
    data
  })
}

export function handleFlightFulfillmentChange(id, data) {
  return request({
    url: `/flight-fulfillments/${id}/flight-change`,
    method: 'put',
    data
  })
}

export function terminateFlightFulfillment(id, reason) {
  return request({
    url: `/flight-fulfillments/${id}/terminate`,
    method: 'put',
    data: { reason }
  })
}

export function markFlightFulfillmentAbnormal(id, abnormalType, reason) {
  return request({
    url: `/flight-fulfillments/${id}/mark-abnormal`,
    method: 'put',
    data: { abnormalType, reason }
  })
}

export function handleFlightFulfillmentAbnormal(id, handleRemark) {
  return request({
    url: `/flight-fulfillments/${id}/handle-abnormal`,
    method: 'put',
    data: { handleRemark }
  })
}

export function batchIssueFlightFulfillmentTickets(ids, ticketDataList) {
  return request({
    url: '/flight-fulfillments/batch/issue',
    method: 'post',
    data: { ids, ticketDataList }
  })
}

export function batchHandleFlightFulfillmentChanges(ids) {
  return request({
    url: '/flight-fulfillments/batch/flight-change',
    method: 'post',
    data: { ids }
  })
}

export function batchMarkFlightFulfillmentAbnormal(ids, abnormalType, reason) {
  return request({
    url: '/flight-fulfillments/batch/mark-abnormal',
    method: 'post',
    data: { ids, abnormalType, reason }
  })
}

export function getFlightFulfillmentLogs(fulfillmentId, params) {
  const url = fulfillmentId ? `/flight-fulfillments/${fulfillmentId}/logs` : '/flight-fulfillments/logs/all'
  return request({
    url,
    method: 'get',
    params
  })
}

export function getFlightFulfillmentStats(params) {
  return request({
    url: '/flight-fulfillments/stats/summary',
    method: 'get',
    params
  })
}

export function checkFlightFulfillmentTicketTimeout() {
  return request({
    url: '/flight-fulfillments/check-timeout',
    method: 'post'
  })
}
