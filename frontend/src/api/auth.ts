import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export interface LoginParams {
  username: string
  password: string
  captcha?: string
}

export interface LoginResult {
  token: string
  expiresIn: number
}

export interface UserInfoResult {
  userInfo: {
    id: number
    username: string
    nickname: string
    avatar: string
    role: string
  }
  roles: string[]
  permissions: string[]
}

export function login(data: LoginParams): Promise<ApiResponse<LoginResult>> {
  return request.post<LoginResult>('/auth/login', data)
}

export function logout(): Promise<ApiResponse<null>> {
  return request.post<null>('/auth/logout')
}

export function getUserInfo(): Promise<ApiResponse<UserInfoResult>> {
  return request.get<UserInfoResult>('/auth/userInfo')
}

export function refreshToken(): Promise<ApiResponse<{ token: string }>> {
  return request.post<{ token: string }>('/auth/refreshToken')
}
