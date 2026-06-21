import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type {
  FullLinkTrace,
  LinkIntegrityReport,
  TrackNodeDetail,
  VerifyNodeParams,
  AddNodeExtensionParams,
} from '@/types/business'

export enum LinkNodeVerificationStatus {
  PENDING = 0,
  VERIFIED = 1,
  SUSPICIOUS = 2,
  FAKE = 3,
}

export const LinkNodeVerificationStatusMap: Record<number, { label: string; type: string }> = {
  [LinkNodeVerificationStatus.PENDING]: { label: '待核验', type: 'info' },
  [LinkNodeVerificationStatus.VERIFIED]: { label: '已核验', type: 'success' },
  [LinkNodeVerificationStatus.SUSPICIOUS]: { label: '存疑', type: 'warning' },
  [LinkNodeVerificationStatus.FAKE]: { label: '虚假', type: 'danger' },
}

export enum IntegrityLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  WARNING = 'warning',
  DANGER = 'danger',
}

export function getFullLinkTrace(shipmentId: number): Promise<ApiResponse<FullLinkTrace>> {
  return request.get(`/logisticsLinkTrace/full-trace/${shipmentId}`)
}

export function checkDuplicateNode(params: {
  shipment_id: number
  track_id: number
  track_content?: string
  track_time?: string
}): Promise<ApiResponse<{ is_duplicate: boolean; existing_node?: any }>> {
  return request.post('/logisticsLinkTrace/check-duplicate', params)
}

export function checkFakeTrack(params: {
  shipment_id: number
  track_id: number
}): Promise<ApiResponse<{ is_fake: boolean; fake_type?: string; fake_reason?: string }>> {
  return request.post('/logisticsLinkTrace/check-fake', params)
}

export function verifyNode(params: VerifyNodeParams): Promise<ApiResponse<null>> {
  return request.post('/logisticsLinkTrace/verify-node', params)
}

export function addNodeExtension(params: AddNodeExtensionParams): Promise<ApiResponse<any>> {
  return request.post('/logisticsLinkTrace/add-extension', params)
}
