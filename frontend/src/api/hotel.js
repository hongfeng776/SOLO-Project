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

export function getHotelRoomList(params) {
  return request({
    url: '/hotel-rooms',
    method: 'get',
    params
  })
}

export function getHotelRoom(id) {
  return request({
    url: `/hotel-rooms/${id}`,
    method: 'get'
  })
}

export function createHotelRoom(data) {
  return request({
    url: '/hotel-rooms',
    method: 'post',
    data
  })
}

export function updateHotelRoom(id, data) {
  return request({
    url: `/hotel-rooms/${id}`,
    method: 'put',
    data
  })
}

export function checkHotelRoomPermission() {
  return request({
    url: '/hotel-rooms/ops/permission',
    method: 'get'
  })
}

export function verifyHotelRoomParams(id, data) {
  return request({
    url: `/hotel-rooms/${id}/ops/verify`,
    method: 'post',
    data
  })
}

export function changeHotelRoomMaintainStatus(id, maintainStatus, reason) {
  return request({
    url: `/hotel-rooms/${id}/ops/maintain-status`,
    method: 'put',
    data: { maintainStatus, reason }
  })
}

export function batchHotelRoomOperation(params) {
  return request({
    url: '/hotel-rooms/ops/batch',
    method: 'post',
    data: params
  })
}

export function getHotelRoomLogs(id, params) {
  return request({
    url: `/hotel-rooms/${id}/ops/logs`,
    method: 'get',
    params
  })
}

export function getAllHotelRoomLogs(params) {
  return request({
    url: '/hotel-rooms/ops/logs/all',
    method: 'get',
    params
  })
}

export function getHotelRoomPriceList(params) {
  return request({
    url: '/hotel-room-prices',
    method: 'get',
    params
  })
}

export function getHotelRoomPrice(id) {
  return request({
    url: `/hotel-room-prices/${id}`,
    method: 'get'
  })
}

export function createHotelRoomPrice(data) {
  return request({
    url: '/hotel-room-prices',
    method: 'post',
    data
  })
}

export function updateHotelRoomPrice(id, data) {
  return request({
    url: `/hotel-room-prices/${id}`,
    method: 'put',
    data
  })
}

export function checkHotelRoomPricePermission() {
  return request({
    url: '/hotel-room-prices/ops/permission',
    method: 'get'
  })
}

export function verifyHotelRoomPriceParams(id, data) {
  return request({
    url: `/hotel-room-prices/${id}/ops/verify`,
    method: 'post',
    data
  })
}

export function changeHotelRoomPriceStatus(id, status, reason) {
  return request({
    url: `/hotel-room-prices/${id}/ops/status`,
    method: 'put',
    data: { status, reason }
  })
}

export function batchHotelRoomPriceOperation(params) {
  return request({
    url: '/hotel-room-prices/ops/batch',
    method: 'post',
    data: params
  })
}

export function getHotelRoomPriceLogs(id, params) {
  return request({
    url: `/hotel-room-prices/${id}/ops/logs`,
    method: 'get',
    params
  })
}

export function getAllHotelRoomPriceLogs(params) {
  return request({
    url: '/hotel-room-prices/ops/logs/all',
    method: 'get',
    params
  })
}

export function getHotelRoomPricePurchases(id, params) {
  return request({
    url: `/hotel-room-prices/${id}/ops/purchases`,
    method: 'get',
    params
  })
}

export function getHotelFulfillmentList(params) {
  return request({ url: '/hotel-fulfillments', method: 'get', params })
}
export function getHotelFulfillment(id) {
  return request({ url: `/hotel-fulfillments/${id}`, method: 'get' })
}
export function checkHotelFulfillmentPermission() {
  return request({ url: '/hotel-fulfillments/ops/permission', method: 'get' })
}
export function verifyHotelFulfillment(id, data) {
  return request({ url: `/hotel-fulfillments/${id}/ops/verify`, method: 'post', data })
}
export function checkoutHotelFulfillment(id, data) {
  return request({ url: `/hotel-fulfillments/${id}/ops/checkout`, method: 'put', data })
}
export function extendHotelFulfillment(id, data) {
  return request({ url: `/hotel-fulfillments/${id}/ops/extend`, method: 'put', data })
}
export function markNoShowHotelFulfillment(id, reason) {
  return request({ url: `/hotel-fulfillments/${id}/ops/noshow`, method: 'put', data: { reason } })
}
export function batchHotelFulfillmentOperation(params) {
  return request({ url: '/hotel-fulfillments/ops/batch', method: 'post', data: params })
}
export function getHotelFulfillmentLogs(id, params) {
  return request({ url: `/hotel-fulfillments/${id}/ops/logs`, method: 'get', params })
}
export function getAllHotelFulfillmentLogs(params) {
  return request({ url: '/hotel-fulfillments/ops/logs/all', method: 'get', params })
}
