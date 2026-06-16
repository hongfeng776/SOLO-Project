export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  role: string
  permissions: string[]
}

export interface User {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  avatar: string
  roleId: number
  roleName: string
  status: number
  createTime: string
  updateTime: string
}
