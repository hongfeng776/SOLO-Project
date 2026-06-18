import { get, post } from '@utils/request'
import type { PageResult } from '@/types/api'

export interface MerchantOnboardingApply {
  id: number
  applyNo: string
  merchantName: string
  merchantType: string
  storeName: string
  status: number
  riskLevel: string
  businessLicense: string
  businessLicenseNo: string
  businessScope: string
  legalPersonName: string
  legalPersonIdCard: string
  legalPersonIdCardFront: string
  legalPersonIdCardBack: string
  legalPersonPhone: string
  industryCategory: string
  industryQualification: string
  industryQualificationNo: string
  qualificationExpireTime?: string
  contactName: string
  contactPhone: string
  contactEmail: string
  shopAddress: string
  brandAuthorization: string
  brandName: string
  otherMaterials?: string
  preCheckResult?: string
  preCheckPassed: number
  initialAuditorId?: number
  initialAuditorName: string
  initialAuditTime?: string
  initialAuditRemark: string
  finalAuditorId?: number
  finalAuditorName: string
  finalAuditTime?: string
  finalAuditRemark: string
  rejectReason: string
  rejectDimension: string
  returnReason: string
  storeOpened: number
  listingEnabled: number
  marketingEnabled: number
  isDuplicate: number
  isFakeQualification: number
  isCrossIndustry: number
  creditScore: number
  submitTime?: string
  createTime: string
  updateTime: string
  creditArchive?: MerchantCreditArchive
}

export interface MerchantOnboardingLog {
  id: number
  applyId: number
  logType: string
  operatorId?: number
  operatorName: string
  operatorRole: string
  beforeStatus?: number
  afterStatus?: number
  remark: string
  detail?: string
  ip: string
  createTime: string
}

export interface MerchantCreditArchive {
  id: number
  applyId: number
  merchantName: string
  businessLicenseNo: string
  legalPersonIdCard: string
  creditScore: number
  creditLevel: string
  onboardingCount: number
  violationCount: number
  fakeQualificationCount: number
  crossIndustryCount: number
  duplicateApplyCount: number
  lastViolationTime?: string
  lastOnboardingTime?: string
  creditDetail?: string
  remark: string
  createTime: string
  updateTime: string
}

export interface MerchantOnboardingStats {
  total: number
  pendingInitial: number
  pendingFinal: number
  initialPassed: number
  approved: number
  rejected: number
  returned: number
  duplicateCount: number
  fakeCount: number
  crossIndustryCount: number
  normalCount: number
  brandCount: number
}

export interface PreCheckResult {
  businessLicense: { passed: boolean; message: string }
  legalPersonInfo: { passed: boolean; message: string }
  industryQualification: { passed: boolean; message: string }
  storeNameUniqueness: { passed: boolean; message: string }
  industryRisk: { passed: boolean; message: string }
  qualificationExpiry: { passed: boolean; message: string }
  overallPassed: boolean
}

export interface DuplicateDetectResult {
  isDuplicate: boolean
  isFake: boolean
  isCrossIndustry: boolean
  details: string[]
}

export const getMerchantOnboardingList = (params: Record<string, unknown>): Promise<PageResult<MerchantOnboardingApply>> => {
  return get<PageResult<MerchantOnboardingApply>>('/merchant-onboarding', params)
}

export const getMerchantOnboardingDetail = (id: number): Promise<MerchantOnboardingApply> => {
  return get<MerchantOnboardingApply>(`/merchant-onboarding/${id}`)
}

export const getMerchantOnboardingLogs = (id: number): Promise<MerchantOnboardingLog[]> => {
  return get<MerchantOnboardingLog[]>(`/merchant-onboarding/${id}/logs`)
}

export const getMerchantCreditArchive = (id: number): Promise<MerchantCreditArchive> => {
  return get<MerchantCreditArchive>(`/merchant-onboarding/${id}/credit`)
}

export const getMerchantCreditByLicense = (licenseNo: string): Promise<MerchantCreditArchive[]> => {
  return get<MerchantCreditArchive[]>(`/merchant-onboarding/credit/${licenseNo}`)
}

export const merchantPreCheck = (data: Record<string, unknown>): Promise<PreCheckResult> => {
  return post<PreCheckResult>('/merchant-onboarding/pre-check', data)
}

export const submitMerchantOnboarding = (data: Record<string, unknown>): Promise<{ id: number; applyNo: string; preCheckResult: PreCheckResult }> => {
  return post<{ id: number; applyNo: string; preCheckResult: PreCheckResult }>('/merchant-onboarding', data)
}

export const initialAuditMerchant = (id: number, action: 'pass' | 'reject', remark: string): Promise<{ id: number; status: number }> => {
  return post<{ id: number; status: number }>(`/merchant-onboarding/${id}/initial-audit`, { action, remark })
}

export const finalAuditMerchant = (id: number, action: 'pass' | 'reject', remark: string): Promise<{ id: number; status: number }> => {
  return post<{ id: number; status: number }>(`/merchant-onboarding/${id}/final-audit`, { action, remark })
}

export const returnMerchantApply = (id: number, reason: string): Promise<{ id: number }> => {
  return post<{ id: number }>(`/merchant-onboarding/${id}/return`, { reason })
}

export const promoteMerchantToFinal = (id: number): Promise<{ id: number }> => {
  return post<{ id: number }>(`/merchant-onboarding/${id}/promote-final`)
}

export const batchAuditMerchant = (ids: number[], action: 'pass' | 'reject' | 'return', remark: string): Promise<{ successCount: number; failCount: number; totalCount: number }> => {
  return post<{ successCount: number; failCount: number; totalCount: number }>('/merchant-onboarding/batch-audit', { ids, action, remark })
}

export const detectDuplicateMerchant = (businessLicenseNo: string, legalPersonIdCard: string): Promise<DuplicateDetectResult> => {
  return post<DuplicateDetectResult>('/merchant-onboarding/detect-duplicate', { businessLicenseNo, legalPersonIdCard })
}

export const getMerchantOnboardingStats = (): Promise<MerchantOnboardingStats> => {
  return get<MerchantOnboardingStats>('/merchant-onboarding/stats')
}
