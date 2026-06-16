import request from '@/utils/request'

export function getSystemLogList(params) {
  return request({
    url: '/system-log/list',
    method: 'get',
    params
  })
}

export function exportSystemLogs(params) {
  return request({
    url: '/system-log/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
