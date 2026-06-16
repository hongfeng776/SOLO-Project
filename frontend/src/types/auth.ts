export interface LoginParams {
  username: string
  password: string
  captcha?: string
  captchaKey?: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  status: number
  createTime: string
  updateTime: string
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
  roles: string[]
  permissions: string[]
}
