import { http } from '@/utils/request'
import type { LoginParams, LoginResult, UserInfo, ChangePasswordParams } from '@/types'

export const loginApi = (data: LoginParams): Promise<LoginResult> => {
  return http.post<LoginResult>('/api/v1/auth/login', data)
}

export const logoutApi = (): Promise<void> => {
  return http.post<void>('/api/v1/auth/logout')
}

export const refreshTokenApi = (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  return http.post<{ accessToken: string; refreshToken: string }>('/api/v1/auth/refresh-token', { refreshToken })
}

export const getCurrentUserApi = (): Promise<UserInfo> => {
  return http.get<UserInfo>('/api/v1/auth/me')
}

export const changePasswordApi = (data: ChangePasswordParams): Promise<void> => {
  return http.post<void>('/api/v1/auth/change-password', data)
}
