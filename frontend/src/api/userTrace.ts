import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type {
  UserTraceInfo,
  UserRegisterLog,
  UserProfileLog,
  UserLoginTrace,
  UserConsumptionLedger,
  ComplianceCheckResult
} from '@/types/business'

export type { UserTraceInfo }

export function getUserTrace(id: number): Promise<ApiResponse<UserTraceInfo>> {
  return request.get<UserTraceInfo>(`/userTrace/full-trace/${id}`)
}

export function getRegisterLog(id: number): Promise<ApiResponse<UserRegisterLog>> {
  return request.get<UserRegisterLog>(`/userTrace/register-log/${id}`)
}

export function getProfileLogs(id: number, limit?: number): Promise<ApiResponse<UserProfileLog[]>> {
  const params = limit ? { limit } : {}
  return request.get<UserProfileLog[]>(`/userTrace/profile-logs/${id}`, { params })
}

export function getLoginTraces(id: number, limit?: number): Promise<ApiResponse<UserLoginTrace[]>> {
  const params = limit ? { limit } : {}
  return request.get<UserLoginTrace[]>(`/userTrace/login-traces/${id}`, { params })
}

export function getConsumptionLedgers(id: number, limit?: number): Promise<ApiResponse<UserConsumptionLedger[]>> {
  const params = limit ? { limit } : {}
  return request.get<UserConsumptionLedger[]>(`/userTrace/consumption-ledgers/${id}`, { params })
}

export function checkCompliance(id: number): Promise<ApiResponse<ComplianceCheckResult>> {
  return request.get<ComplianceCheckResult>(`/userTrace/compliance/${id}`)
}

export function getDuplicateUsers(id: number): Promise<ApiResponse<any[]>> {
  return request.get<any[]>(`/userTrace/duplicate-users/${id}`)
}
