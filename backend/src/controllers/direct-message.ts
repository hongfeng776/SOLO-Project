import type { Request, Response, NextFunction } from 'express'
import { directMessageService } from '@services/direct-message'
import { success, fail } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const listMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, conversationId, senderId, receiverId,
      keyword, status, riskLevel, violationType, intercepted, isReported, startTime, endTime } = req.query
    const data = await directMessageService.listMessages({
      page: Number(page), pageSize: Number(pageSize),
      conversationId: conversationId !== undefined ? Number(conversationId) : undefined,
      senderId: senderId !== undefined ? Number(senderId) : undefined,
      receiverId: receiverId !== undefined ? Number(receiverId) : undefined,
      keyword: keyword as string,
      status: status !== undefined ? Number(status) : undefined,
      riskLevel: riskLevel !== undefined ? Number(riskLevel) : undefined,
      violationType: violationType as string,
      intercepted: intercepted !== undefined ? Number(intercepted) : undefined,
      isReported: isReported !== undefined ? Number(isReported) : undefined,
      startTime: startTime as string,
      endTime: endTime as string
    })
    success(res, data)
  } catch (error) { next(error) }
}

export const listConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, riskLevel, status, violationMin, keyword } = req.query
    const data = await directMessageService.listConversations({
      page: Number(page), pageSize: Number(pageSize),
      riskLevel: riskLevel !== undefined ? Number(riskLevel) : undefined,
      status: status !== undefined ? Number(status) : undefined,
      violationMin: violationMin !== undefined ? Number(violationMin) : undefined,
      keyword: keyword as string
    })
    success(res, data)
  } catch (error) { next(error) }
}

export const getMessageDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await directMessageService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) { next(error) }
}

export const getConversationDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await directMessageService.conversationDetail(Number(req.params.id))
    success(res, data)
  } catch (error) { next(error) }
}

export const getConversationMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 50 } = req.query
    const data = await directMessageService.getConversationMessages(
      Number(req.params.id), Number(page), Number(pageSize)
    )
    success(res, data)
  } catch (error) { next(error) }
}

export const sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || ''
    const userAgent = (req.headers['user-agent'] as string) || ''
    const data = await directMessageService.send({
      ...req.body,
      senderId: req.body.senderId || req.user!.userId,
      ip,
      userAgent
    })
    const msg = data.intercepted ? '私信内容违规已被拦截' : (data.punishment ? '发送成功，已触发账号处罚' : '发送成功')
    success(res, data, msg)
  } catch (error) { next(error) }
}

export const removeMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    await directMessageService.removeMessage(Number(req.params.id), operator)
    success(res, null, '删除成功')
  } catch (error) { next(error) }
}

export const batchRemoveMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    const data = await directMessageService.batchRemove(ids, operator)
    success(res, data, `批量清理成功 ${data.success}/${data.total}`)
  } catch (error) { next(error) }
}

export const punishAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    const { userId, punishment, related } = req.body
    const data = await directMessageService.punishAccount(Number(userId), punishment, related, operator)
    success(res, data, '处罚执行成功')
  } catch (error) { next(error) }
}

export const batchBanAccounts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    const { userIds, punishment, violationType } = req.body
    const data = await directMessageService.batchBanAccounts(userIds, punishment, violationType, operator)
    success(res, data, `批量封禁成功 ${data.success}/${data.total}`)
  } catch (error) { next(error) }
}

export const restrictConversation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    const { conversationId, restrict, reason } = req.body
    const data = await directMessageService.restrictConversation(
      Number(conversationId), !!restrict, reason || '系统限制', operator
    )
    success(res, data, data.restricted ? '会话已限制' : '会话已解除限制')
  } catch (error) { next(error) }
}

export const getMessageTrace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await directMessageService.getMessageTrace(Number(req.params.id))
    success(res, data)
  } catch (error) { next(error) }
}

export const getConversationTrace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await directMessageService.getConversationTrace(Number(req.params.id))
    success(res, data)
  } catch (error) { next(error) }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await directMessageService.getStats()
    success(res, data)
  } catch (error) { next(error) }
}

export const checkCompliance = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { content, senderId, receiverId } = req.body
    const data = await directMessageService.checkCompliance(
      content, Number(senderId || req.user!.userId), Number(receiverId)
    )
    success(res, data)
  } catch (error) { next(error) }
}

export const getSensitiveWords = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await directMessageService.getSensitiveWords()
    success(res, data)
  } catch (error) { next(error) }
}

export const highlightContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { content } = req.body
    const data = await directMessageService.highlightContent(content)
    success(res, data)
  } catch (error) { next(error) }
}

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await directMessageService.getAuditLogs(Number(req.params.id))
    success(res, data)
  } catch (error) { next(error) }
}

export const getConversationAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await directMessageService.getConversationAuditLogs(Number(req.params.id))
    success(res, data)
  } catch (error) { next(error) }
}
