import { post, get } from '@utils/request'
import type { UserInfo } from '@store/modules/user'

export interface LoginParams {
  username: string
  password: string
  captcha: string
}

export interface LoginResult {
  token: string
  refreshToken: string
  expiresIn: number
}

export function loginApi(data: LoginParams) {
  return post<LoginResult>('/auth/login', data)
}

export function logoutApi() {
  return post<void>('/auth/logout')
}

export function getUserInfoApi() {
  return get<UserInfo>('/auth/userinfo')
}

export function getCaptchaApi() {
  return get<{ captchaId: string; captchaBase64: string }>('/auth/captcha')
}

export function refreshTokenApi(refreshToken: string) {
  return post<LoginResult>('/auth/refresh-token', { refreshToken })
}

export function changePasswordApi(data: { oldPassword: string; newPassword: string }) {
  return post<void>('/auth/change-password', data)
}
