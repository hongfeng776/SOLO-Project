import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface RiskRule {
  id: number
  name: string
  code: string
  type: number
  typeName: string
  level: number
  levelName: string
  description: string
  conditions: RiskCondition[]
  action: number
  actionName: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface RiskCondition {
  field: string
  fieldName: string
  operator: string
  value: string | number | string[]
  logic?: 'AND' | 'OR'
}

export interface RiskWarning {
  id: number
  ruleId: number
  ruleName: string
  level: number
  levelName: string
  targetType: string
  targetId: number
  targetName: string
  reason: string
  status: number
  statusName: string
  handler?: string
  handlerId?: number
  handleRemark?: string
  handleTime?: string
  createdAt: string
}

export interface RiskCheckResult {
  passed: boolean
  warnings: {
    ruleId: number
    ruleName: string
    level: number
    levelName: string
    reason: string
  }[]
  suggestedAction: string
}

export interface RiskRuleQueryParams extends PageParams {
  name?: string
  type?: number
  level?: number
  enabled?: boolean
}

export interface RiskWarningQueryParams extends PageParams {
  ruleId?: number
  level?: number
  status?: number
  targetType?: string
  startTime?: string
  endTime?: string
}

export interface HandleWarningParams {
  status: number
  remark: string
}

export function getRiskRuleList(params: RiskRuleQueryParams): Promise<ApiResponse<PageResult<RiskRule>>> {
  return request.get<PageResult<RiskRule>>('/risk/rule/list', { params })
}

export function getRiskRule(id: number): Promise<ApiResponse<RiskRule>> {
  return request.get<RiskRule>(`/risk/rule/${id}`)
}

export function createRiskRule(data: Partial<RiskRule>): Promise<ApiResponse<RiskRule>> {
  return request.post<RiskRule>('/risk/rule', data)
}

export function updateRiskRule(id: number, data: Partial<RiskRule>): Promise<ApiResponse<RiskRule>> {
  return request.put<RiskRule>(`/risk/rule/${id}`, data)
}

export function deleteRiskRule(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/risk/rule/${id}`)
}

export function toggleRiskRule(id: number, enabled: boolean): Promise<ApiResponse<null>> {
  return request.put<null>(`/risk/rule/${id}/toggle`, { enabled })
}

export function getRiskWarningList(params: RiskWarningQueryParams): Promise<ApiResponse<PageResult<RiskWarning>>> {
  return request.get<PageResult<RiskWarning>>('/risk/warning/list', { params })
}

export function getRiskWarning(id: number): Promise<ApiResponse<RiskWarning>> {
  return request.get<RiskWarning>(`/risk/warning/${id}`)
}

export function handleRiskWarning(id: number, data: HandleWarningParams): Promise<ApiResponse<null>> {
  return request.put<null>(`/risk/warning/${id}/handle`, data)
}

export function batchHandleRiskWarning(ids: number[], data: HandleWarningParams): Promise<ApiResponse<null>> {
  return request.post<null>('/risk/warning/batchHandle', { ids, ...data })
}

export function checkOrder(orderId: number): Promise<ApiResponse<RiskCheckResult>> {
  return request.post<RiskCheckResult>(`/risk/check/order`, { orderId })
}

export function checkUser(userId: number): Promise<ApiResponse<RiskCheckResult>> {
  return request.post<RiskCheckResult>(`/risk/check/user`, { userId })
}
