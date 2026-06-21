import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type { ValidationResult, ProviderPreCheckReport } from '@/types/business'

export function validateProviderCode(code: string): Promise<ApiResponse<ValidationResult>> {
  return request.post<ValidationResult>('/logisticsProviderValidate/provider-code', { providerCode: code })
}

export function validateCreditCode(code: string): Promise<ApiResponse<ValidationResult>> {
  return request.post<ValidationResult>('/logisticsProviderValidate/credit-code', { creditCode: code })
}

export function validateBusinessLicense(licenseNo: string): Promise<ApiResponse<ValidationResult>> {
  return request.post<ValidationResult>('/logisticsProviderValidate/business-license', { businessLicenseNo: licenseNo })
}

export function validatePhone(phone: string): Promise<ApiResponse<ValidationResult>> {
  return request.post<ValidationResult>('/logisticsProviderValidate/phone', { phone })
}

export function validateEmail(email: string): Promise<ApiResponse<ValidationResult>> {
  return request.post<ValidationResult>('/logisticsProviderValidate/email', { email })
}

export function validateIdCard(idCard: string): Promise<ApiResponse<ValidationResult>> {
  return request.post<ValidationResult>('/logisticsProviderValidate/id-card', { idCard })
}

export function validateDateRange(start: string, end: string): Promise<ApiResponse<ValidationResult>> {
  return request.post<ValidationResult>('/logisticsProviderValidate/date-range', { start, end })
}

export function checkDuplicateProvider(data: {
  providerName?: string
  creditCode?: string
  businessLicenseNo?: string
  excludeId?: number
}): Promise<ApiResponse<{
  hasDuplicate: boolean
  duplicateFields: Array<{ field: string; message: string; existingProvider?: any }>
}>> {
  return request.post('/logisticsProviderValidate/check-duplicate', data)
}

export function checkFieldEditPermission(id: number, fieldName: string): Promise<ApiResponse<{
  canEdit: boolean
  reason?: string
}>> {
  return request.post(`/logisticsProviderValidate/check-field-edit`, { providerId: id, fieldName })
}

export function checkFeeCompliance(id: number, feeData: any): Promise<ApiResponse<{
  compliant: boolean
  violations: Array<{ type: string; message: string; level: 'error' | 'warning' }>
}>> {
  return request.post(`/logisticsProviderValidate/fee-compliance/${id}`, feeData)
}

export function runProviderPreCheck(id: number): Promise<ApiResponse<ProviderPreCheckReport>> {
  return request.get<ProviderPreCheckReport>(`/logisticsProviderValidate/pre-check/${id}`)
}

export function validateEnterpriseQualification(id: number): Promise<ApiResponse<{
  passed: boolean
  validQualifications: any[]
  expiredQualifications: any[]
  warnings: string[]
}>> {
  return request.get(`/logisticsProviderValidate/enterprise-qualification/${id}`)
}

export function validateCoverage(id: number): Promise<ApiResponse<{
  passed: boolean
  branchCount: number
  coveredCities: string[]
  coveredProvinces: string[]
  minimumBranches: number
  minimumCities: number
}>> {
  return request.get(`/logisticsProviderValidate/coverage/${id}`)
}

export function validateTimeliness(id: number): Promise<ApiResponse<{
  passed: boolean
  crossProvinceTimeliness: number
  intraProvinceTimeliness: number
  requirements: any
}>> {
  return request.get(`/logisticsProviderValidate/timeliness/${id}`)
}

export function validatePermissions(id: number): Promise<ApiResponse<{
  passed: boolean
  permissions: any[]
  issues: string[]
}>> {
  return request.get(`/logisticsProviderValidate/permissions/${id}`)
}
