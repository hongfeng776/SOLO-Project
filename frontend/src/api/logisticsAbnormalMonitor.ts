import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type {
  AbnormalDetectionRule,
  AbnormalDetectionResult,
  ProcessAbnormalParams,
} from '@/types/business'

export enum AbnormalDetectionType {
  STAGNANT = 'stagnant',
  MISROUTE = 'misroute',
  TIMEOUT = 'timeout',
  DELAYED_DELIVERY = 'delayed_delivery',
  REPEAT_TRACK = 'repeat_track',
  FAKE_TRACK = 'fake_track',
  NODE_MISSING = 'node_missing',
}

export const AbnormalDetectionTypeMap: Record<string, { label: string; type: string }> = {
  [AbnormalDetectionType.STAGNANT]: { label: '物流停滞', type: 'warning' },
  [AbnormalDetectionType.MISROUTE]: { label: '错发', type: 'danger' },
  [AbnormalDetectionType.TIMEOUT]: { label: '超时', type: 'warning' },
  [AbnormalDetectionType.DELAYED_DELIVERY]: { label: '派送延迟', type: 'warning' },
  [AbnormalDetectionType.REPEAT_TRACK]: { label: '重复节点', type: 'info' },
  [AbnormalDetectionType.FAKE_TRACK]: { label: '虚假轨迹', type: 'danger' },
  [AbnormalDetectionType.NODE_MISSING]: { label: '节点缺失', type: 'warning' },
}

export enum DetectionScene {
  IN_TRANSIT = 'in_transit',
  DELIVERING = 'delivering',
  SIGNED = 'signed',
  ALL = 'all',
}

export const DetectionSceneMap: Record<string, string> = {
  [DetectionScene.IN_TRANSIT]: '运输中',
  [DetectionScene.DELIVERING]: '派送中',
  [DetectionScene.SIGNED]: '已签收',
  [DetectionScene.ALL]: '全部场景',
}

export enum AlertLevel {
  LIGHT = 1,
  NORMAL = 2,
  SEVERE = 3,
}

export const AlertLevelMap: Record<number, { label: string; type: string }> = {
  [AlertLevel.LIGHT]: { label: '轻微', type: 'info' },
  [AlertLevel.NORMAL]: { label: '一般', type: 'warning' },
  [AlertLevel.SEVERE]: { label: '严重', type: 'danger' },
}

export function runAbnormalDetection(shipmentId: number, trackId: number): Promise<ApiResponse<AbnormalDetectionResult>> {
  return request.post('/logisticsAbnormalMonitor/detect', {
    shipment_id: shipmentId,
    track_id: trackId,
  })
}

export function processAbnormal(params: ProcessAbnormalParams): Promise<ApiResponse<null>> {
  return request.post('/logisticsAbnormalMonitor/process', params)
}

export function batchDetectAbnormal(shipmentIds: number[]): Promise<ApiResponse<any[]>> {
  return request.post('/logisticsAbnormalMonitor/batch-detect', {
    shipment_ids: shipmentIds,
  })
}

export function getDetectionRules(status?: number): Promise<ApiResponse<AbnormalDetectionRule[]>> {
  return request.get('/logisticsAbnormalMonitor/rules', { params: { status } })
}

export function createDetectionRule(data: Partial<AbnormalDetectionRule>): Promise<ApiResponse<AbnormalDetectionRule>> {
  return request.post('/logisticsAbnormalMonitor/rules', data)
}

export function updateDetectionRule(id: number, data: Partial<AbnormalDetectionRule>): Promise<ApiResponse<AbnormalDetectionRule>> {
  return request.put(`/logisticsAbnormalMonitor/rules/${id}`, data)
}

export function deleteDetectionRule(id: number): Promise<ApiResponse<null>> {
  return request.delete(`/logisticsAbnormalMonitor/rules/${id}`)
}
