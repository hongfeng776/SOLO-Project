import type { BaseEntity, Status } from './index'

export interface UserInfo extends BaseEntity {
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  role: string
  roleName: string
  status: Status
  permissions: string[]
}

export interface LoginParams {
  username: string
  password: string
  captcha?: string
}

export interface LoginResult {
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterParams {
  username: string
  password: string
  confirmPassword: string
  email: string
  phone: string
  captcha?: string
}
