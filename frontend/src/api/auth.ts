import { post, get } from '@utils/request'
import type { LoginParams, LoginResult } from '@/types/auth'

export const login = (data: LoginParams): Promise<LoginResult> => {
  return post<LoginResult>('/auth/login', data)
}

export const getUserInfo = (): Promise<LoginResult> => {
  return get<LoginResult>('/auth/info')
}

export const logout = (): Promise<null> => {
  return post<null>('/auth/logout')
}

export const refreshToken = (): Promise<{ token: string; refreshToken: string }> => {
  return post<{ token: string; refreshToken: string }>('/auth/refresh')
}
