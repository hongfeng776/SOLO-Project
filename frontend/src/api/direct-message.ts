import { get, post, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  DirectMessage, DmConversation, DmComplianceCheckResult,
  DmMessageTraceResult, DmConversationTraceResult,
  DmStats, DmPunishment, HighlightPart, DmAuditLogItem
} from '@/types/business'

export const getDmStats = (): Promise<DmStats> => {
  return get<DmStats>('/dm/stats')
}

export const getDmMessageList = (params: Record<string, unknown>): Promise<PageResult<DirectMessage>> => {
  return get<PageResult<DirectMessage>>('/dm/messages', params)
}

export const getDmConversationList = (params: Record<string, unknown>): Promise<PageResult<DmConversation>> => {
  return get<PageResult<DmConversation>>('/dm/conversations', params)
}

export const getDmMessageDetail = (id: number): Promise<DirectMessage> => {
  return get<DirectMessage>(`/dm/messages/${id}`)
}

export const getDmConversationDetail = (id: number): Promise<DmConversation> => {
  return get<DmConversation>(`/dm/conversations/${id}`)
}

export const getDmConversationMessages = (
  id: number,
  params: { page?: number; pageSize?: number } = {}
): Promise<PageResult<DirectMessage>> => {
  return get<PageResult<DirectMessage>>(`/dm/conversations/${id}/messages`, params)
}

export const sendDmMessage = (data: {
  senderId?: number
  receiverId: number
  content: string
  contentType?: number
}): Promise<{
  message?: DirectMessage
  intercepted: boolean
  complianceResult: DmComplianceCheckResult
  punishment?: DmPunishment
}> => {
  return post<{
    message?: DirectMessage
    intercepted: boolean
    complianceResult: DmComplianceCheckResult
    punishment?: DmPunishment
  }>('/dm/send', data)
}

export const deleteDmMessage = (id: number): Promise<null> => {
  return del<null>(`/dm/messages/${id}`)
}

export const batchRemoveDmMessages = (ids: number[]): Promise<{ total: number; success: number }> => {
  return post<{ total: number; success: number }>('/dm/batch-remove', { ids })
}

export const punishDmAccount = (data: {
  userId: number
  punishment: DmPunishment
  related?: {
    messageId?: number
    conversationId?: number
    violationType?: string
    reason?: string
  }
}): Promise<any> => {
  return post<any>('/dm/punish', data)
}

export const batchBanDmAccounts = (data: {
  userIds: number[]
  punishment: DmPunishment
  violationType: string
}): Promise<{ total: number; success: number }> => {
  return post<{ total: number; success: number }>('/dm/batch-ban', data)
}

export const restrictDmConversation = (data: {
  conversationId: number
  restrict: boolean
  reason?: string
}): Promise<{
  conversationId: number
  restricted: boolean
  reason: string
}> => {
  return post<{ conversationId: number; restricted: boolean; reason: string }>('/dm/restrict-conversation', data)
}

export const getDmMessageTrace = (id: number): Promise<DmMessageTraceResult> => {
  return get<DmMessageTraceResult>(`/dm/messages/${id}/trace`)
}

export const getDmConversationTrace = (id: number): Promise<DmConversationTraceResult> => {
  return get<DmConversationTraceResult>(`/dm/conversations/${id}/trace`)
}

export const checkDmCompliance = (data: {
  content: string
  senderId?: number
  receiverId: number
}): Promise<DmComplianceCheckResult> => {
  return post<DmComplianceCheckResult>('/dm/check-compliance', data)
}

export const getDmSensitiveWords = (): Promise<string[]> => {
  return get<string[]>('/dm/sensitive-words')
}

export const highlightDmContent = (content: string): Promise<HighlightPart[]> => {
  return post<HighlightPart[]>('/dm/highlight', { content })
}

export const getDmAuditLogs = (messageId: number): Promise<DmAuditLogItem[]> => {
  return get<DmAuditLogItem[]>(`/dm/messages/${messageId}/audit-logs`)
}

export const getDmConversationAuditLogs = (conversationId: number): Promise<DmAuditLogItem[]> => {
  return get<DmAuditLogItem[]>(`/dm/conversations/${conversationId}/audit-logs`)
}
