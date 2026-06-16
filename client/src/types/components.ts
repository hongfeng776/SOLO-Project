import type { FormRules } from 'element-plus'

export interface IFilterOption {
  label: string
  value: string | number | boolean
}

export interface IFilterConfig {
  prop: string
  label: string
  type: 'input' | 'select' | 'date' | 'daterange' | 'datetime' | 'number' | 'numberrange'
  placeholder?: string
  options?: IFilterOption[]
  clearable?: boolean
  multiple?: boolean
  min?: number
  max?: number
  precision?: number
  controls?: boolean
  valueFormat?: string
  advanced?: boolean
  defaultValue?: any
  rules?: FormRules
}

export interface ITableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: string | boolean
  sortable?: string | boolean
  align?: string
  required?: boolean
  showOverflowTooltip?: boolean
  slot?: string
  type?: 'money' | 'rate' | 'change' | 'date' | 'datetime' | 'text'
  precision?: number
}
