import { get, post } from '@/utils/axios'
import type { LoginParams, LoginResult, UserInfo } from '@/types/user'

export function loginApi(data: LoginParams): Promise<LoginResult> {
  return post<LoginResult>('/auth/login', data)
}

export function logoutApi(): Promise<null> {
  return post<null>('/auth/logout')
}

export function getUserInfoApi(): Promise<UserInfo> {
  return get<UserInfo>('/auth/user-info')
}

export function refreshTokenApi(refreshToken: string): Promise<LoginResult> {
  return post<LoginResult>('/auth/refresh-token', { refreshToken })
}
