import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'
import type {
  ShipmentQueryParams,
  ShipmentListItem,
  BatchOperationResult,
  BatchOperationPermission,
} from '@/types/business'

export enum BatchOperationType {
  MARK_ABNORMAL = 'mark_abnormal',
  LAUNCH_VERIFY = 'launch_verify',
  SYNC_STATUS = 'sync_status',
}

export const BatchOperationTypeMap: Record<string, { label: string; permissionKey: keyof BatchOperationPermission }> = {
  [BatchOperationType.MARK_ABNORMAL]: { label: '批量标记异常', permissionKey: 'can_mark_abnormal' },
  [BatchOperationType.LAUNCH_VERIFY]: { label: '批量发起核查', permissionKey: 'can_launch_verify' },
  [BatchOperationType.SYNC_STATUS]: { label: '批量同步状态', permissionKey: 'can_sync_status' },
}

export enum TrackStatus {
  PICKED_UP = 1,
  IN_TRANSIT = 2,
  DELIVERING = 3,
  SIGNED = 4,
  ABNORMAL = 5,
  RETURNED = 6,
}

export const TrackStatusMap: Record<number, { label: string; type: string }> = {
  [TrackStatus.PICKED_UP]: { label: '已揽收', type: 'primary' },
  [TrackStatus.IN_TRANSIT]: { label: '运输中', type: 'warning' },
  [TrackStatus.DELIVERING]: { label: '派送中', type: 'primary' },
  [TrackStatus.SIGNED]: { label: '已签收', type: 'success' },
  [TrackStatus.ABNORMAL]: { label: '异常', type: 'danger' },
  [TrackStatus.RETURNED]: { label: '退回', type: 'info' },
}

export function getUserPermissions(): Promise<ApiResponse<BatchOperationPermission>> {
  return request.get('/logisticsLinkBatch/permissions')
}

export function queryShipments(params: ShipmentQueryParams): Promise<ApiResponse<PageResult<ShipmentListItem>>> {
  return request.get('/logisticsLinkBatch/query', { params })
}

export function getRefreshData(shipmentIds: number[]): Promise<ApiResponse<ShipmentListItem[]>> {
  return request.post('/logisticsLinkBatch/refresh', { shipment_ids: shipmentIds })
}

export function batchMarkAbnormal(
  shipmentIds: number[],
  abnormalType: string,
  abnormalDesc: string
): Promise<ApiResponse<BatchOperationResult>> {
  return request.post('/logisticsLinkBatch/mark-abnormal', {
    shipment_ids: shipmentIds,
    abnormal_type: abnormalType,
    abnormal_desc: abnormalDesc,
  })
}

export function batchLaunchVerify(
  shipmentIds: number[],
  verifyReason: string
): Promise<ApiResponse<BatchOperationResult>> {
  return request.post('/logisticsLinkBatch/launch-verify', {
    shipment_ids: shipmentIds,
    verify_reason: verifyReason,
  })
}

export function batchSyncStatus(shipmentIds: number[]): Promise<ApiResponse<BatchOperationResult>> {
  return request.post('/logisticsLinkBatch/sync-status', {
    shipment_ids: shipmentIds,
  })
}
