import type { Request, Response, NextFunction } from 'express'
import { commentService } from '@services/comment'
import { success, fail } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, keyword, noteId, userId, riskLevel, violationType } = req.query
    const data = await commentService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
      keyword: keyword as string,
      noteId: noteId !== undefined ? Number(noteId) : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      riskLevel: riskLevel !== undefined ? Number(riskLevel) : undefined,
      violationType: violationType as string
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await commentService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || ''
    const data = await commentService.create({
      ...req.body,
      userId: req.user!.userId,
      ip
    })
    success(res, data, data.intercepted ? '评论已被拦截' : '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await commentService.update(Number(req.params.id), req.body)
    success(res, data, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    await commentService.remove(Number(req.params.id), operator)
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const audit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    const data = await commentService.audit(Number(req.params.id), req.body, operator)
    success(res, data, '审核操作成功')
  } catch (error) {
    next(error)
  }
}

export const batchAudit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, ...data } = req.body
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    await commentService.batchAudit(ids, data, operator)
    success(res, null, '批量审核成功')
  } catch (error) {
    next(error)
  }
}

export const batchDelete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    await commentService.batchRemove(ids, operator)
    success(res, null, '批量删除成功')
  } catch (error) {
    next(error)
  }
}

export const batchMarkReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    const operator = req.user ? { userId: req.user.userId, username: req.user.username } : undefined
    await commentService.batchMarkReview(ids, operator!)
    success(res, null, '批量标记复核成功')
  } catch (error) {
    next(error)
  }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await commentService.getStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const checkCompliance = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { content, noteId } = req.body
    const userId = req.user!.userId
    const data = await commentService.checkCompliance(content, userId, Number(noteId))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getTrace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await commentService.getTrace(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getSensitiveWords = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await commentService.getSensitiveWords()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const highlightContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { content } = req.body
    const data = await commentService.highlightContent(content)
    success(res, data)
  } catch (error) {
    next(error)
  }
}
