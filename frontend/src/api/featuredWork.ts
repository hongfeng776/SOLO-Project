import request from '@/utils/request'
import type {
  FeaturedWork,
  FeaturedResourceItem,
  FeaturedPreValidateResult,
  FeaturedWorkLog,
  BatchFeatureResult,
  BatchCancelResult,
  FeaturedTraceResult,
  FeaturedStatusOverview,
  FeaturedResourceListParams,
  FeaturedListParams,
  FeaturedLogListParams,
  PageResult,
  FeaturedLevel,
  DisplayPosition,
  FeaturedVerifyParams,
  FeaturedCancelParams,
  FeaturedWeightParams,
  FeaturedPositionParams,
  FeaturedLevelParams
} from '@/types'

export const getResourceListForFeatured = (params: FeaturedResourceListParams) => {
  return request.get<PageResult<FeaturedResourceItem>>('/featured-works/resources', params)
}

export const preValidateFeatured = (resourceId: number) => {
  return request.post<FeaturedPreValidateResult>('/featured-works/validate', { resourceId })
}

export const createFeaturedWork = (data: {
  resourceId: number
  featuredLevel?: FeaturedLevel
  displayWeight?: number
  displayPosition?: DisplayPosition
  verifyReason?: string
  originalProof?: string
  expireAt?: string
  remark?: string
  operatorName?: string
}) => {
  return request.post<FeaturedWork>('/featured-works/feature', data)
}

export const getFeaturedList = (params: FeaturedListParams) => {
  return request.get<PageResult<FeaturedWork>>('/featured-works', params)
}

export const getFeaturedDetail = (id: number) => {
  return request.get<FeaturedWork>(`/featured-works/${id}`)
}

export const verifyFeatured = (id: number, data: FeaturedVerifyParams) => {
  return request.put<{ updated: boolean; featured: FeaturedWork }>(`/featured-works/${id}/verify`, data)
}

export const cancelFeatured = (id: number, data: FeaturedCancelParams) => {
  return request.put<{ updated: boolean; featured: FeaturedWork }>(`/featured-works/${id}/cancel`, data)
}

export const adjustFeaturedWeight = (id: number, data: FeaturedWeightParams) => {
  return request.put<{
    updated: boolean
    beforeWeight: number
    afterWeight: number
    featured: FeaturedWork
  }>(`/featured-works/${id}/weight`, data)
}

export const adjustFeaturedPosition = (id: number, data: FeaturedPositionParams) => {
  return request.put<{
    updated: boolean
    beforePosition: DisplayPosition | null
    afterPosition: DisplayPosition | null
    featured: FeaturedWork
  }>(`/featured-works/${id}/position`, data)
}

export const adjustFeaturedLevel = (id: number, data: FeaturedLevelParams) => {
  return request.put<{
    updated: boolean
    beforeLevel: FeaturedLevel
    afterLevel: FeaturedLevel
    featured: FeaturedWork
  }>(`/featured-works/${id}/level`, data)
}

export const batchFeatureWorks = (data: {
  resourceIds: number[]
  defaultLevel?: FeaturedLevel
  defaultPosition?: DisplayPosition
  expireAt?: string
  operatorName?: string
}) => {
  return request.post<BatchFeatureResult>('/featured-works/batch-feature', data)
}

export const batchCancelFeatured = (data: {
  featuredIds: number[]
  reason?: string
  operatorName?: string
}) => {
  return request.post<BatchCancelResult>('/featured-works/batch-cancel', data)
}

export const getFeaturedWorkLogs = (params: FeaturedLogListParams) => {
  return request.get<PageResult<FeaturedWorkLog>>('/featured-works/logs', params)
}

export const traceFeaturedWork = (id: number) => {
  return request.get<FeaturedTraceResult>(`/featured-works/${id}/trace`)
}

export const getFeaturedStatusOverview = () => {
  return request.get<FeaturedStatusOverview>('/featured-works/overview')
}
