import request from '@/utils/request'
import type { LoginParams, LoginResult, UserInfo, User } from '@/types/user'
import type { PageResult } from '@/utils/request'

export const loginApi = (data: LoginParams) => {
  return request.post<LoginResult>('/auth/login', data)
}

export const logoutApi = () => {
  return request.post('/auth/logout')
}

export const getUserInfoApi = () => {
  return request.get<UserInfo>('/auth/userinfo')
}

export const getUserListApi = (params: any) => {
  return request.get<PageResult<User>>('/system/user', params)
}

export const createUserApi = (data: Partial<User>) => {
  return request.post<User>('/system/user', data)
}

export const updateUserApi = (id: number, data: Partial<User>) => {
  return request.put<User>(`/system/user/${id}`, data)
}

export const deleteUserApi = (id: number) => {
  return request.delete(`/system/user/${id}`)
}

export const updateUserStatusApi = (id: number, status: number) => {
  return request.put(`/system/user/${id}/status`, { status })
}
