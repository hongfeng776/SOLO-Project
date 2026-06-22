import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export interface InboundParams {
  goods_id: number
  goods_code: string
  goods_name: string
  goods_spec?: string
  batch_no: string
  production_date?: string
  expiry_date?: string
  type: number
  quantity: number
  unit_cost?: number
  warehouse_location: string
  warehouse_zone?: string
  shelf_no?: string
  remark?: string
}

export interface OutboundParams {
  goods_id: number
  goods_code: string
  goods_name: string
  goods_spec?: string
  batch_no: string
  type: number
  quantity: number
  warehouse_location: string
  order_id?: number
  order_no?: string
  transfer_target_location?: number
  transfer_target_name?: string
  remark?: string
}

export interface ValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }>
  warnings: string[]
}

export const validateInbound = (data: InboundParams) =>
  request.post<ApiResponse<ValidationResult>>('/warehouseStockValidate/validate-inbound', data)

export const createInbound = (data: InboundParams) =>
  request.post<ApiResponse<any>>('/warehouseStockValidate/inbound', data)

export const validateOutbound = (data: OutboundParams) =>
  request.post<ApiResponse<ValidationResult>>('/warehouseStockValidate/validate-outbound', data)

export const createOutbound = (data: OutboundParams) =>
  request.post<ApiResponse<any>>('/warehouseStockValidate/outbound', data)
