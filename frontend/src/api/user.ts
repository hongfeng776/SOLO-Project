import request from '@/utils/request'
import type { UserInfo } from '@/types'

interface LoginParams {
  username: string
  password: string
}

interface LoginResult {
  token: string
}

export const login = (data: LoginParams) => {
  return request.post<LoginResult>('/auth/login', data, { showError: true })
}

export const logout = () => {
  return request.post('/auth/logout')
}

export const getUserInfo = () => {
  return request.get<UserInfo>('/auth/userinfo')
}

export const refreshToken = () => {
  return request.post<LoginResult>('/auth/refresh')
}
