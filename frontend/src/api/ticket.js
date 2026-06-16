import request from '@/utils/request'

export function getTicketList(params) {
  return request({
    url: '/ticket/list',
    method: 'get',
    params
  })
}

export function getTicket(id) {
  return request({
    url: `/ticket/${id}`,
    method: 'get'
  })
}

export function createTicket(data) {
  return request({
    url: '/ticket',
    method: 'post',
    data
  })
}

export function updateTicket(id, data) {
  return request({
    url: `/ticket/${id}`,
    method: 'put',
    data
  })
}

export function deleteTicket(id) {
  return request({
    url: `/ticket/${id}`,
    method: 'delete'
  })
}

export function batchDeleteTicket(ids) {
  return request({
    url: '/ticket/batch',
    method: 'delete',
    data: { ids }
  })
}
