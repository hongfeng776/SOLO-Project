import { post, get } from '@/utils/request'
import type { LoginData, LoginResult, Result, UserInfo } from '@/types/api'

export function login(data: LoginData) {
  return post<Result<LoginResult>>('/auth/login', data)
}

export function logout() {
  return post<Result<void>>('/auth/logout')
}

export function getUserInfo() {
  return get<Result<UserInfo>>('/auth/userInfo')
}
