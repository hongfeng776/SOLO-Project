import { get, post, put, request } from '@/utils/request'
import type { Result, PageResult } from '@/types/api'
import type { UserVO } from '@/types/api'
import service from '@/utils/request'

export interface UserQuery {
  pageNum?: number
  pageSize?: number
  username?: string
  status?: number
  keyword?: string
  createTimeStart?: string
  createTimeEnd?: string
  learnedWordsMin?: number
  learnedWordsMax?: number
  studyDaysMin?: number
  studyDaysMax?: number
  activityLevel?: number
}

export function getUserList(params: UserQuery) {
  return get<Result<PageResult<UserVO>>>('/user', params)
}

export function getUserDetail(id: number) {
  return get<Result<UserVO>>(`/user/${id}`)
}

export function createUser(data: any) {
  return post<Result<void>>('/user', data)
}

export function updateUser(data: any) {
  return put<Result<void>>('/user', data)
}

export function deleteUser(ids: number[]) {
  return request<Result<void>>({ url: '/user/batch', method: 'DELETE', data: { ids } })
}

export function updateUserStatus(id: number, status: number) {
  return request<Result<void>>({ url: '/user/status', method: 'PUT', params: { id, status } })
}

export function batchUpdateUserStatus(ids: number[], status: number) {
  return put<Result<void>>('/user/batch-status', { ids, status })
}

export function exportUserList(params: UserQuery, onProgress?: (loaded: number, total: number) => void) {
  return new Promise<Blob>((resolve, reject) => {
    const url = '/api/user/export'
    const queryStr = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    const fullUrl = queryStr ? `${url}?${queryStr}` : url

    const xhr = new XMLHttpRequest()
    xhr.open('GET', fullUrl, true)
    xhr.responseType = 'blob'
    const userStore = (window as any).__userStore__ || null
    const token = localStorage.getItem('token') || (userStore && userStore.token)
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }
    if (onProgress) {
      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(e.loaded, e.total)
        }
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as Blob)
      } else {
        reject(new Error(`导出失败: ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error('网络错误'))
    xhr.send()
  })
}
