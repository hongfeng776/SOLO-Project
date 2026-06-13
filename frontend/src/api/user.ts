import request from '@/utils/request'

export interface LoginVO {
  token: string
  id: number
  username: string
  nickname: string
  avatar: string
  roles: string[]
}

export type LoginResult = LoginVO

export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  email?: string
  phone?: string
  roles: string[]
}

export function login(params: LoginParams) {
  return request<LoginResult>({
    url: '/auth/login',
    method: 'post',
    data: params
  })
}

export function logout() {
  return request<void>({
    url: '/auth/logout',
    method: 'post'
  })
}

export function getUserInfo() {
  return request<UserInfo>({
    url: '/user/info',
    method: 'get'
  })
}
