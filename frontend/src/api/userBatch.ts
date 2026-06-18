import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type { BatchResult } from '@/types/business'

export interface BatchUpdateTagsParams {
  ids: number[]
  tags: string
  mode: 'append' | 'replace' | 'remove'
  scope?: 'global' | 'partial'
}

export interface BatchFreezeParams {
  ids: number[]
  reason?: string
  scope?: 'global' | 'partial'
}

export interface BatchResetPermissionsParams {
  ids: number[]
  permissions?: string[]
  scope?: 'global' | 'partial'
}

export interface BatchUpdateStatusParams {
  ids: number[]
  status: number
  scope?: 'global' | 'partial'
}

export function batchUpdateTags(params: BatchUpdateTagsParams): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/userBatch/batch-update-tags', params)
}

export function batchFreeze(params: BatchFreezeParams): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/userBatch/batch-freeze', params)
}

export function batchUnfreeze(ids: number[], scope?: 'global' | 'partial'): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/userBatch/batch-unfreeze', { ids, scope })
}

export function batchResetPermissions(params: BatchResetPermissionsParams): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/userBatch/batch-reset-permissions', params)
}

export function batchUpdateStatus(params: BatchUpdateStatusParams): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/userBatch/batch-update-status', params)
}
