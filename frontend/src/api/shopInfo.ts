import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export enum ShopStatus {
  NORMAL = 1,
  CLOSED = 2,
  RECTIFY = 3,
  BANNED = 4,
}

export enum ShopLevel {
  NEW = 1,
  BRONZE = 2,
  SILVER = 3,
  GOLD = 4,
  DIAMOND = 5,
}

export const SHOP_STATUS_OPTIONS: Array<{ label: string; value: number; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = [
  { label: '正常营业', value: 1, type: 'success' },
  { label: '停业整顿', value: 2, type: 'warning' },
  { label: '违规整改', value: 3, type: 'warning' },
  { label: '平台封禁', value: 4, type: 'danger' },
]

export const SHOP_STATUS_SOURCE_OPTIONS = [
  { label: '商家主动', value: 'merchant' },
  { label: '平台违规', value: 'platform' },
  { label: '系统自动', value: 'system' },
]

export const SHOP_LEVEL_OPTIONS: Array<{ label: string; value: number; color: string }> = [
  { label: '新店', value: 1, color: '#909399' },
  { label: '铜牌', value: 2, color: '#cd7f32' },
  { label: '银牌', value: 3, color: '#c0c0c0' },
  { label: '金牌', value: 4, color: '#ffd700' },
  { label: '钻石', value: 5, color: '#00bfff' },
]

export const SHOP_CATEGORY_OPTIONS = [
  { label: '食品餐饮', value: '食品餐饮' },
  { label: '服装鞋帽', value: '服装鞋帽' },
  { label: '数码电器', value: '数码电器' },
  { label: '美妆个护', value: '美妆个护' },
  { label: '家居用品', value: '家居用品' },
  { label: '母婴用品', value: '母婴用品' },
  { label: '医疗健康', value: '医疗健康' },
  { label: '图书文娱', value: '图书文娱' },
  { label: '运动户外', value: '运动户外' },
  { label: '其他', value: '其他' },
]

export const SHOP_TAG_PRESET = [
  '官方旗舰店', '品牌授权', '极速发货', '七天无理由',
  '正品保障', '假一赔十', '满减优惠', '包邮专区',
]

export interface ShopInfoItem {
  id: number
  name: string
  shop_name?: string
  shop_logo?: string
  shop_banner?: string
  shop_intro?: string
  shop_category?: string
  shop_sub_category?: string
  shop_tags?: string
  shop_level?: number
  shop_status?: number
  shop_status_text?: string
  shop_status_reason?: string
  shop_status_source?: string
  order_accept_permission?: number
  marketing_participate_permission?: number
  settlement_permission?: number
  shop_open_date?: string
  shop_operation_duration_days?: number
  shop_province?: string
  shop_city?: string
  shop_district?: string
  shop_address?: string
  customer_service_phone?: string
  customer_service_hours?: string
  settle_status?: number
  settle_status_text?: string
  contact?: string
  phone?: string
  created_at?: string
  credit_score?: number
}

export interface ShopInfoUpdatePayload {
  merchant_id: number
  shop_name?: string
  shop_logo?: string
  shop_banner?: string
  shop_intro?: string
  shop_category?: string
  shop_sub_category?: string
  shop_tags?: string
  shop_province?: string
  shop_city?: string
  shop_district?: string
  shop_address?: string
  customer_service_phone?: string
  customer_service_hours?: string
}

export interface ShopStatusChangePayload {
  merchant_id: number
  target_status: number
  change_source: string
  change_reason: string
  effective_time?: string
  remark?: string
  operator_id?: number
  operator_name?: string
}

export interface ShopQueryParams extends PageParams {
  shop_name?: string
  shop_status?: number
  shop_status_list?: number[]
  shop_level?: number
  shop_level_list?: number[]
  shop_category?: string
  open_duration_min?: number
  open_duration_max?: number
  settle_status?: number
  startDate?: string
  endDate?: string
}

export const validateShopName = (shop_name: string, exclude_merchant_id?: number) =>
  request.post<ApiResponse<{ valid: boolean; message?: string }>>('/shopInfo/validate/shopName', { shop_name, exclude_merchant_id })

export const validateCustomerServicePhone = (phone: string) =>
  request.post<ApiResponse<{ valid: boolean; message?: string }>>('/shopInfo/validate/phone', { phone })

export const validateShopCategory = (category: string, sub_category?: string) =>
  request.post<ApiResponse<{ valid: boolean; message?: string }>>('/shopInfo/validate/category', { category, sub_category })

export const detectSensitiveWords = (text: string) =>
  request.post<ApiResponse<{ words: string[]; risk_level: number }>>('/shopInfo/validate/sensitiveWords', { text })

export const checkShopDuplicate = (params: { shop_name?: string; customer_service_phone?: string; exclude_id?: number }) =>
  request.post<ApiResponse<{ is_unique: boolean; duplicates: any[] }>>('/shopInfo/validate/duplicate', params)

export const validateAllShopInfo = (payload: ShopInfoUpdatePayload) =>
  request.post<ApiResponse<{ valid: boolean; errors: any[]; warnings: any[] }>>('/shopInfo/validate/all', payload)

export const getShopInfo = (merchant_id: number) =>
  request.get<ApiResponse<ShopInfoItem>>(`/shopInfo/merchant/${merchant_id}`)

export const getShopList = (params: ShopQueryParams) =>
  request.get<ApiResponse<PageResult<ShopInfoItem>>>('/shopInfo/list', { params })

export const updateShopInfo = (payload: ShopInfoUpdatePayload) =>
  request.post<ApiResponse<any>>('/shopInfo/update', payload)

export const changeShopStatus = (payload: ShopStatusChangePayload) =>
  request.post<ApiResponse<any>>('/shopStatus/change', payload)

export const getShopStatusLogs = (merchant_id: number) =>
  request.get<ApiResponse<any[]>>(`/shopStatus/logs/${merchant_id}`)

export const batchUpdateShopTags = (params: { merchant_ids: number[]; tags: string[]; append_mode?: boolean }) =>
  request.post<ApiResponse<any>>('/shopBatch/tags', params)

export const batchSuspendShops = (params: { merchant_ids: number[]; reason: string; target_status?: number }) =>
  request.post<ApiResponse<any>>('/shopBatch/suspend', params)

export const batchResumeShops = (params: { merchant_ids: number[]; reason: string }) =>
  request.post<ApiResponse<any>>('/shopBatch/resume', params)

export const batchChangeShopLevel = (params: { merchant_ids: number[]; target_level: number; reason: string }) =>
  request.post<ApiResponse<any>>('/shopBatch/level', params)

export const getShopBatchScope = (permission_level = 1) =>
  request.get<ApiResponse<{ max_count: number; allowed_statuses: number[] }>>('/shopBatch/scope', { params: { permission_level } })

export const getShopFullTrace = (merchant_id: number) =>
  request.get<ApiResponse<any>>(`/shopTrace/merchant/${merchant_id}/full`)

export const getShopInfoChangeLogs = (merchant_id: number) =>
  request.get<ApiResponse<any[]>>(`/shopTrace/merchant/${merchant_id}/infoLogs`)

export const getShopOperationLedgers = (merchant_id: number) =>
  request.get<ApiResponse<any[]>>(`/shopTrace/merchant/${merchant_id}/ledgers`)

export const checkShopCompliance = (merchant_id: number) =>
  request.post<ApiResponse<any>>('/shopTrace/check/compliance', { merchant_id })

export const checkShopUniqueness = (params: { shop_name?: string; customer_service_phone?: string; exclude_id?: number }) =>
  request.post<ApiResponse<any>>('/shopTrace/check/uniqueness', params)

export const checkShopCrossCategory = (merchant_id: number) =>
  request.post<ApiResponse<any>>('/shopTrace/check/crossCategory', { merchant_id })
