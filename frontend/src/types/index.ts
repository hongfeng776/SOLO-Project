export interface UserInfo {
  id: number
  username: string
  nickname: string
  role: string
  roles?: string[]
  permissions?: string[]
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
  roles: string[]
  permissions: string[]
}

export interface Role {
  id: number
  name: string
  code: string
  description?: string
  status?: number
  created_at?: string
}

export interface Permission {
  id: number
  name: string
  code: string
  type: 'menu' | 'button' | 'api'
  parent_id?: number
  path?: string
  component?: string
  icon?: string
  sort?: number
  status?: number
  created_at?: string
}

export interface Menu {
  path: string
  name: string
  icon?: string
  component?: any
  redirect?: string
  children?: Menu[]
  hidden?: boolean
  meta?: {
    title: string
    icon?: string
    roles?: string[]
    permissions?: string[]
    keepAlive?: boolean
  }
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
    permissions?: string[]
    keepAlive?: boolean
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

export interface TableColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: 'left' | 'right' | boolean
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  showOverflowTooltip?: boolean
  formatter?: (row: any, column: any, value: any, index: number) => string
  slot?: string
}

export interface PaginationConfig {
  page: number
  pageSize: number
  pageSizes?: number[]
  layout?: string
}

export interface ValidationRule {
  required?: boolean
  message?: string
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: any) => boolean | string | Promise<boolean | string>
  trigger?: 'blur' | 'change'
}

export interface UserFormData {
  id?: number
  username: string
  nickname: string
  email: string
  password?: string
  status: number
  role_ids?: number[]
  role?: string
  created_at?: string
}

export interface WorkFormData {
  id?: number
  title: string
  description: string
  cover_image: string
  author_id: number
  author_nickname: string
  category: string
  status: number
}
