export interface UserInfo {
  id: number
  username: string
  nickname: string
  role: string
  email?: string
  status?: number
  created_at?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

export interface MenuItem {
  path: string
  name: string
  icon?: string
  component?: any
  redirect?: string
  children?: MenuItem[]
  hidden?: boolean
  meta?: {
    title: string
    icon?: string
    roles?: string[]
  }
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
