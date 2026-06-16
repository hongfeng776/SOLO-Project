import type { Request, Response, NextFunction } from 'express'
import { commentService } from '@services/comment'
import { success } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, keyword, noteId, userId } = req.query
    const data = await commentService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
      keyword: keyword as string,
      noteId: noteId !== undefined ? Number(noteId) : undefined,
      userId: userId !== undefined ? Number(userId) : undefined
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
    const data = await commentService.create({
      ...req.body,
      userId: req.user!.userId
    })
    success(res, data, '创建成功')
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

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await commentService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const audit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await commentService.audit(Number(req.params.id), req.body)
    success(res, data, '审核操作成功')
  } catch (error) {
    next(error)
  }
}

export const batchAudit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, ...data } = req.body
    await commentService.batchAudit(ids, data)
    success(res, null, '批量审核成功')
  } catch (error) {
    next(error)
  }
}

export const batchDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    await commentService.batchRemove(ids)
    success(res, null, '批量删除成功')
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
