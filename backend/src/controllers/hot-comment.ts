import type { Request, Response, NextFunction } from 'express'
import { hotCommentService } from '@services/hot-comment'
import { success } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const computeAndRank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { noteId, limit, force } = req.body
    const data = await hotCommentService.computeAndRank({
      noteId: noteId ? Number(noteId) : undefined,
      limit: limit ? Number(limit) : 50,
      force: !!force
    })
    success(res, data)
  } catch (e) { next(e) }
}

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, noteId, keyword, isTop, status, sourceType, rankFrom, rankTo } = req.query
    const data = await hotCommentService.list({
      page: Number(page), pageSize: Number(pageSize),
      noteId: noteId ? Number(noteId) : undefined,
      keyword: keyword as string,
      isTop: isTop !== undefined ? Number(isTop) : undefined,
      status: status !== undefined ? Number(status) : undefined,
      sourceType: sourceType as string,
      rankFrom: rankFrom !== undefined ? Number(rankFrom) : undefined,
      rankTo: rankTo !== undefined ? Number(rankTo) : undefined
    })
    success(res, data)
  } catch (e) { next(e) }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await hotCommentService.getStats()) } catch (e) { next(e) }
}

export const manualTop = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, startOrder } = req.body
    const data = await hotCommentService.manualTop(
      ids, req.user?.userId || 0, req.user?.username || 'system',
      startOrder ? Number(startOrder) : 1
    )
    success(res, data)
  } catch (e) { next(e) }
}

export const cancelTop = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    const data = await hotCommentService.cancelTop(ids, req.user?.userId || 0, req.user?.username || 'system')
    success(res, data)
  } catch (e) { next(e) }
}

export const batchTop = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    const data = await hotCommentService.batchTop(ids, req.user?.userId || 0, req.user?.username || 'system')
    success(res, data)
  } catch (e) { next(e) }
}

export const batchOff = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    const data = await hotCommentService.batchOff(ids, req.user?.userId || 0, req.user?.username || 'system')
    success(res, data)
  } catch (e) { next(e) }
}

export const refreshRanking = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await hotCommentService.refreshRanking()) } catch (e) { next(e) }
}

export const getTrace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await hotCommentService.getTrace(Number(req.params.commentId))) }
  catch (e) { next(e) }
}

export const getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, commentId, action, handlerId } = req.query
    const data = await hotCommentService.getLogs({
      page: Number(page), pageSize: Number(pageSize),
      commentId: commentId ? Number(commentId) : undefined,
      action: action !== undefined ? Number(action) : undefined,
      handlerId: handlerId ? Number(handlerId) : undefined
    })
    success(res, data)
  } catch (e) { next(e) }
}

export const anomalyDetect = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await hotCommentService.anomalyDetect()) }
  catch (e) { next(e) }
}
