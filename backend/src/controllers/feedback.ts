import type { Request, Response, NextFunction } from 'express'
import { feedbackService } from '@services/feedback'
import { success } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, type, keyword, userId } = req.query
    const data = await feedbackService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
      type: type as string,
      keyword: keyword as string,
      userId: userId !== undefined ? Number(userId) : undefined
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await feedbackService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await feedbackService.create({
      ...req.body,
      userId: req.user?.userId
    })
    success(res, data, '提交成功')
  } catch (error) {
    next(error)
  }
}

export const handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await feedbackService.handle(Number(req.params.id), req.body)
    success(res, data, '处理成功')
  } catch (error) {
    next(error)
  }
}

export const batchHandle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, ...data } = req.body
    await feedbackService.batchHandle(ids, data)
    success(res, null, '批量处理成功')
  } catch (error) {
    next(error)
  }
}

export const close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await feedbackService.close(Number(req.params.id))
    success(res, data, '关闭成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await feedbackService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await feedbackService.getStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}
