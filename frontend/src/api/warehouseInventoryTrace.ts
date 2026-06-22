import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export const getFullTrace = (inventoryId: number) =>
  request.get<ApiResponse<any>>(`/warehouseInventoryTrace/full-trace/${inventoryId}`)

export const checkOverQuantity = (data: { goods_id: number; batch_no: string; warehouse_location: string; quantity: number }) =>
  request.post<ApiResponse<any>>('/warehouseInventoryTrace/check-over-quantity', data)

export const checkDuplicateBatch = (data: { goods_id: number; batch_no: string; warehouse_location: string; exclude_id?: number }) =>
  request.post<ApiResponse<any>>('/warehouseInventoryTrace/check-duplicate-batch', data)

export const checkFakeInventory = (inventoryId: number) =>
  request.post<ApiResponse<any>>('/warehouseInventoryTrace/check-fake', { inventory_id: inventoryId })
