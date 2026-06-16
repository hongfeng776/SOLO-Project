export interface PageParams {
  page: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  children?: SelectOption[]
}

export interface TreeNode {
  id: string | number
  label: string
  children?: TreeNode[]
  [key: string]: any
}

export type Status = 'enable' | 'disable'

export interface TimestampEntity {
  createdAt: string
  updatedAt: string
}

export interface BaseEntity extends TimestampEntity {
  id: string | number
}
