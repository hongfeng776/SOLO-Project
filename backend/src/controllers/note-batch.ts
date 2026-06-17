import type { Request, Response, NextFunction } from 'express'
import { noteBatchService } from '@services/note-batch'
import { success, paginate } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, userId } = req.query
    const data = await noteBatchService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
      userId: userId !== undefined ? Number(userId) : undefined
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteBatchService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const retry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteBatchService.retry(Number(req.params.id))
    success(res, data, '重试成功')
  } catch (error) {
    next(error)
  }
}
