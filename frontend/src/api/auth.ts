import { post, get } from '@/utils/request'
import type { LoginRequest, LoginResponse, UserInfo, ApiResponse } from '@/types'

export function loginApi(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return post<LoginResponse>('/auth/login', data)
}

export function registerApi(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return post<LoginResponse>('/auth/register', data)
}

export function logoutApi(): Promise<ApiResponse<null>> {
  return post<null>('/auth/logout')
}

export function getUserInfoApi(): Promise<ApiResponse<UserInfo>> {
  return get<UserInfo>('/auth/profile')
}

export function refreshTokenApi(): Promise<ApiResponse<{ token: string }>> {
  return post<{ token: string }>('/auth/refresh-token')
}
