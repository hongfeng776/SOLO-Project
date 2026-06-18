import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface QualificationMaterial {
  id?: number
  qualification_type: string
  certificate_no?: string
  certificate_holder?: string
  file_url?: string
  valid_from?: string
  expire_date?: string
  category_id?: number
  material_order?: number
  status?: number
  verification_status?: number
  verification_source?: string
  verification_remark?: string
  missing_flag?: number
  violation_flag?: number
  audit_opinion?: string
  created_at?: string
  updated_at?: string
  file?: File
  uploadProgress?: number
}

export interface MerchantQualificationSubmitPayload {
  merchant_id: number
  merchant_info?: {
    name?: string
    legal_person?: string
    legal_id_card?: string
    business_license_no?: string
    credit_code?: string
    license_valid_from?: string
    license_valid_to?: string
    license_image_url?: string
    legal_id_front_url?: string
    legal_id_back_url?: string
    registered_capital?: number
    establish_date?: string
    business_scope?: string
    contact?: string
    phone?: string
    address?: string
    industry_type?: string
    qualification_remark?: string
  }
  qualifications: QualificationMaterial[]
}

export interface MerchantAuditSettleItem {
  id: number
  name: string
  contact?: string
  phone?: string
  legal_person?: string
  credit_code?: string
  business_license_no?: string
  license_valid_from?: string
  license_valid_to?: string
  industry_type?: string
  settle_status: number
  settle_status_text?: string
  shop_open_status?: number
  goods_publish_permission?: number
  qualification_remark?: string
  audit_reason?: string
  last_audit_time?: string
  created_at?: string
  has_expired_qualification?: boolean
}

export interface AuditApprovePayload {
  merchant_id: number
  reason?: string
  qualification_opinions?: Array<{
    qualification_id: number
    audit_opinion?: string
    missing_flag?: number
    violation_flag?: number
    status?: number
  }>
}

export interface AuditRejectPayload {
  merchant_id: number
  reason: string
  missing_materials?: string[]
  violation_points?: string[]
  need_resubmit?: number
  resubmit_deadline?: string
  qualification_opinions?: Array<{
    qualification_id: number
    audit_opinion?: string
    missing_flag?: number
    violation_flag?: number
    status?: number
  }>
}

export interface BatchOperationResult {
  success: number
  failed: number
  details: Array<{
    merchant_id: number
    success: boolean
    message?: string
  }>
}

export const QUALIFICATION_TYPE_OPTIONS = [
  { value: 'business_license', label: '营业执照' },
  { value: 'legal_id_card', label: '法人身份证' },
  { value: 'industry_qualification', label: '行业资质证书' },
  { value: 'brand_authorization', label: '品牌授权书' },
  { value: 'food_business_license', label: '食品经营许可证' },
  { value: 'food_operation_license', label: '食品生产许可证' },
  { value: 'other', label: '其他资质' },
]

export const SETTLE_STATUS_OPTIONS = [
  { value: 0, label: '待提交', type: 'info' },
  { value: 1, label: '待审核', type: 'warning' },
  { value: 2, label: '审核通过', type: 'success' },
  { value: 3, label: '审核驳回', type: 'danger' },
  { value: 4, label: '资质过期', type: 'danger' },
  { value: 5, label: '资质异常', type: 'warning' },
  { value: 6, label: '已禁用', type: 'info' },
]

export const VERIFICATION_STATUS_OPTIONS = [
  { value: 0, label: '未核验', type: 'info' },
  { value: 1, label: '核验通过', type: 'success' },
  { value: 2, label: '核验不通过', type: 'danger' },
  { value: 3, label: '核验异常', type: 'warning' },
]

export function validateDocumentFormat(params: { type: string; value: string }): Promise<ApiResponse<{ valid: boolean; message?: string }>> {
  return request.post('/merchantQualification/validate/document', params)
}

export function validateDateRange(params: { valid_from?: string; expire_date?: string }): Promise<ApiResponse<{ valid: boolean; message?: string }>> {
  return request.post('/merchantQualification/validate/dateRange', params)
}

export function checkDuplicateMerchant(params: { credit_code?: string; business_license_no?: string; exclude_id?: number }): Promise<ApiResponse<{ valid: boolean; message?: string }>> {
  return request.post('/merchantQualification/validate/duplicate', params)
}

export function verifyIndustryData(params: { qualification_type: string; certificate_no: string }): Promise<ApiResponse<{ verified: boolean; remark?: string }>> {
  return request.post('/merchantQualification/validate/industry', params)
}

export function checkCompleteness(payload: MerchantQualificationSubmitPayload): Promise<ApiResponse<{ complete: boolean; missing: string[]; violations: string[] }>> {
  return request.post('/merchantQualification/validate/completeness', payload)
}

export function submitMerchantQualification(payload: MerchantQualificationSubmitPayload): Promise<ApiResponse<any>> {
  return request.post('/merchantQualification/submit', payload)
}

export function resubmitMerchantQualification(payload: MerchantQualificationSubmitPayload): Promise<ApiResponse<any>> {
  return request.post('/merchantQualification/resubmit', payload)
}

export function getQualificationList(params: PageParams & {
  merchant_id?: number
  qualification_type?: string
  status?: number
  verification_status?: number
  expire_start?: string
  expire_end?: string
}): Promise<ApiResponse<PageResult<QualificationMaterial>>> {
  return request.get('/merchantQualification/list', { params })
}

export function getQualificationByMerchant(merchantId: number): Promise<ApiResponse<QualificationMaterial[]>> {
  return request.get(`/merchantQualification/merchant/${merchantId}`)
}

export function getSettleMerchantList(params: PageParams & {
  name?: string
  phone?: string
  settle_status?: number
  settle_status_list?: string
  credit_code?: string
  license_expire_start?: string
  license_expire_end?: string
  industry_type?: string
  startDate?: string
  endDate?: string
}): Promise<ApiResponse<PageResult<MerchantAuditSettleItem>>> {
  return request.get('/merchantQualificationAudit/merchant/list', { params })
}

export function getAuditDetail(merchantId: number): Promise<ApiResponse<any>> {
  return request.get(`/merchantQualificationAudit/merchant/${merchantId}/detail`)
}

export function approveMerchantAudit(payload: AuditApprovePayload): Promise<ApiResponse<any>> {
  return request.post('/merchantQualificationAudit/approve', payload)
}

export function rejectMerchantAudit(payload: AuditRejectPayload): Promise<ApiResponse<any>> {
  return request.post('/merchantQualificationAudit/reject', payload)
}

export function reviewMerchantQualification(payload: { merchant_id: number; reason?: string }): Promise<ApiResponse<any>> {
  return request.post('/merchantQualificationAudit/review', payload)
}

export function batchReviewQualification(payload: { merchant_ids: number[]; reason?: string }): Promise<ApiResponse<BatchOperationResult>> {
  return request.post('/merchantQualificationBatch/review', payload)
}

export function batchRemindMerchant(payload: { merchant_ids: number[]; reminder_type: 'expire' | 'resubmit' | 'review'; message?: string }): Promise<ApiResponse<BatchOperationResult>> {
  return request.post('/merchantQualificationBatch/remind', payload)
}

export function batchFreezeMerchant(payload: { merchant_ids: number[]; reason?: string; freeze_permissions: Array<'shop' | 'goods' | 'all'> }): Promise<ApiResponse<BatchOperationResult>> {
  return request.post('/merchantQualificationBatch/freeze', payload)
}

export function batchApproveMerchant(payload: { merchant_ids: number[]; reason?: string }): Promise<ApiResponse<BatchOperationResult>> {
  return request.post('/merchantQualificationBatch/approve', payload)
}

export function batchRejectMerchant(payload: { merchant_ids: number[]; reason: string; missing_materials?: string[]; violation_points?: string[] }): Promise<ApiResponse<BatchOperationResult>> {
  return request.post('/merchantQualificationBatch/reject', payload)
}

export function getFullTrace(merchantId: number): Promise<ApiResponse<any>> {
  return request.get(`/merchantQualificationTrace/merchant/${merchantId}/full`)
}

export function getQualificationLedger(params: PageParams & {
  merchant_id?: number
  operation_type?: string
  start_time?: string
  end_time?: string
}): Promise<ApiResponse<PageResult<any>>> {
  return request.get('/merchantQualificationTrace/ledger', { params })
}

export function checkUniqueness(params: {
  credit_code?: string
  business_license_no?: string
  legal_id_card?: string
  phone?: string
  name?: string
  exclude_merchant_id?: number
}): Promise<ApiResponse<{
  is_unique: boolean
  duplicates: Array<{ field: string; value: string; merchant_ids: number[]; merchant_names: string[]; message: string }>
}>> {
  return request.post('/merchantQualificationTrace/check/uniqueness', params)
}

export function checkFraud(params: {
  merchant_id?: number
  credit_code?: string
  business_license_no?: string
  certificate_nos?: string[]
}): Promise<ApiResponse<{
  is_fraud: boolean
  risk_points: Array<{ level: 'low' | 'medium' | 'high'; field: string; value?: string; message: string }>
  suggestion: string
}>> {
  return request.post('/merchantQualificationTrace/check/fraud', params)
}
