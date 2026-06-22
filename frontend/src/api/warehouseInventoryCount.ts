import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export interface CountParams {
  inventory_ids: number[]
  actual_quantities: number[]
  count_type: 'full' | 'partial'
  remark?: string
}

export interface CorrectParams {
  inventory_id: number
  correct_quantity: number
  inventory_type: number
  loss_reason?: string
  abnormal_reason?: string
  remark?: string
}

export const executeCount = (data: CountParams) =>
  request.post<ApiResponse<any>>('/warehouseInventoryCount/execute', data)

export const executeCorrection = (data: CorrectParams) =>
  request.post<ApiResponse<any>>('/warehouseInventoryCount/correction', data)

export const confirmCount = (inventoryId: number) =>
  request.post<ApiResponse<any>>(`/warehouseInventoryCount/confirm/${inventoryId}`)

export const syncInventory = (goodsId: number, quantity: number) =>
  request.post<ApiResponse<any>>('/warehouseInventoryCount/sync', { goods_id: goodsId, quantity })
