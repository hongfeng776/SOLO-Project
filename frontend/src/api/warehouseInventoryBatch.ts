import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'

export interface InventoryQueryParams {
  batch_no?: string
  warehouse_location?: string
  inventory_type?: number
  count_status?: number
  goods_code?: string
  goods_name?: string
  is_low_stock_alert?: number
  page?: number
  page_size?: number
}

export interface BatchTransferParams {
  inventory_ids: number[]
  target_location: string
  target_zone: string
  reason?: string
}

export interface BatchAlertParams {
  inventory_ids: number[]
  threshold: number
}

export interface BatchImportParams {
  data_list: Array<{
    goods_code: string
    batch_no: string
    warehouse_location: string
    actual_quantity: number
  }>
  tolerance_rate?: number
}

export const getUserPermissions = () =>
  request.get<ApiResponse<any>>('/warehouseInventoryBatch/permissions')

export const queryInventory = (params: InventoryQueryParams) =>
  request.get<ApiResponse<PageResult<any>>>('/warehouseInventoryBatch/query', { params })

export const batchCount = (inventoryIds: number[]) =>
  request.post<ApiResponse<any>>('/warehouseInventoryBatch/batch-count', { inventory_ids: inventoryIds })

export const batchTransfer = (data: BatchTransferParams) =>
  request.post<ApiResponse<any>>('/warehouseInventoryBatch/batch-transfer', data)

export const batchLowStockAlert = (data: BatchAlertParams) =>
  request.post<ApiResponse<any>>('/warehouseInventoryBatch/batch-alert', data)

export const batchImportCount = (data: BatchImportParams) =>
  request.post<ApiResponse<any>>('/warehouseInventoryBatch/batch-import', data)

export const getRefreshData = (inventoryIds: number[]) =>
  request.post<ApiResponse<any>>('/warehouseInventoryBatch/refresh', { inventory_ids: inventoryIds })
