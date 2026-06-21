import { http } from '@/utils/request'
import type { PaginationParams, PaginationResult, DanmakuItem, DanmakuOperateParams, DanmakuBatchOperateParams, DanmakuBatchOperateResult, DanmakuTraceResult, DanmakuDuplicateCheckResult, DanmakuValidateResult } from '@/types'

export const getDanmakuManageListApi = (params: PaginationParams): Promise<PaginationResult<DanmakuItem>> => {
  return http.get<PaginationResult<DanmakuItem>>('/api/v1/danmaku-manage', params)
}

export const operateDanmakuApi = (id: number, data: DanmakuOperateParams): Promise<any> => {
  return http.post<any>(`/api/v1/danmaku-manage/${id}/operate`, data)
}

export const batchOperateDanmakusApi = (data: DanmakuBatchOperateParams): Promise<DanmakuBatchOperateResult> => {
  return http.post<DanmakuBatchOperateResult>('/api/v1/danmaku-manage/batch-operate', data)
}

export const traceDanmakuApi = (params: { danmakuId?: number; contentId?: number; userUid?: string }): Promise<DanmakuTraceResult> => {
  return http.get<DanmakuTraceResult>('/api/v1/danmaku-manage/trace', params)
}

export const checkDuplicateOperationApi = (id: number, operationType: string): Promise<DanmakuDuplicateCheckResult> => {
  return http.get<DanmakuDuplicateCheckResult>(`/api/v1/danmaku-manage/${id}/check-duplicate`, { operationType })
}

export const validateOperationApi = (id: number, operationType: string): Promise<DanmakuValidateResult> => {
  return http.get<DanmakuValidateResult>(`/api/v1/danmaku-manage/${id}/validate`, { operationType })
}

export const archiveDanmakusByContentApi = (contentId: number): Promise<any> => {
  return http.post<any>(`/api/v1/danmaku-manage/archive-by-content/${contentId}`)
}
