import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type {
  ValidateResult,
  GoodsRequiredField,
  SkuCheckResult,
  BrandCategoryCheckResult
} from '@/types/business'

export interface ValidateCreateParams {
  merchantId: number
  categoryId: number
  brandId?: number
}

export function validateGoodsCreate(data: ValidateCreateParams): Promise<ApiResponse<ValidateResult>> {
  return request.post<ValidateResult>('/api/v1/goodsValidate/validate-create', data)
}

export function getCategoryRequiredFields(categoryId: number): Promise<ApiResponse<GoodsRequiredField[]>> {
  return request.get<GoodsRequiredField[]>('/api/v1/goodsValidate/category-required-fields', {
    params: { categoryId }
  })
}

export function checkSkuUniqueness(sku: string, goodsId?: number): Promise<ApiResponse<SkuCheckResult>> {
  return request.get<SkuCheckResult>('/api/v1/goodsValidate/check-sku', {
    params: { sku, goodsId }
  })
}

export interface BrandCategoryParams {
  brandId: number
  categoryId: number
  merchantId: number
}

export function checkBrandCategoryCombo(params: BrandCategoryParams): Promise<ApiResponse<BrandCategoryCheckResult>> {
  return request.get<BrandCategoryCheckResult>('/api/v1/goodsValidate/check-brand-category', { params })
}
