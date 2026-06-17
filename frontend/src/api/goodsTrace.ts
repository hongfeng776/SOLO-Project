import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type { GoodsFullTrace, ConsistencyResult, RepeatSuggestion } from '@/types/business'

export function getGoodsFullTrace(goodsId: number): Promise<ApiResponse<GoodsFullTrace>> {
  return request.get<GoodsFullTrace>(`/api/v1/goodsTrace/full-trace/${goodsId}`)
}

export function checkConsistency(goodsId: number): Promise<ApiResponse<ConsistencyResult>> {
  return request.get<ConsistencyResult>(`/api/v1/goodsTrace/check-consistency/${goodsId}`)
}

export function getRepeatSuggestions(goodsId: number): Promise<ApiResponse<RepeatSuggestion[]>> {
  return request.get<RepeatSuggestion[]>(`/api/v1/goodsTrace/repeat-suggestions/${goodsId}`)
}
