export interface PageParams {
  page?: number
  pageSize?: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ListResult<T> {
  list: T[]
}

export interface TreeNode<T = unknown> {
  id: number
  name: string
  parentId?: number | null
  children?: TreeNode<T>[]
  [key: string]: unknown
}

export interface SelectOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
  children?: SelectOption[]
}

export interface DictItem {
  label: string
  value: string | number
  type?: string
  color?: string
}
