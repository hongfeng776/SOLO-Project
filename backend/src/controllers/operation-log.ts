import type { Request, Response, NextFunction } from 'express'
import { operationLogService } from '@services/operation-log'
import { success } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, type, keyword, userId, startTime, endTime } = req.query
    const data = await operationLogService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      type: type as string,
      keyword: keyword as string,
      userId: userId !== undefined ? Number(userId) : undefined,
      startTime: startTime as string,
      endTime: endTime as string
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await operationLogService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await operationLogService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const batchDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    await operationLogService.batchRemove(ids)
    success(res, null, '批量删除成功')
  } catch (error) {
    next(error)
  }
}

export const clean = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days } = req.body
    await operationLogService.clean(days ? Number(days) : undefined)
    success(res, null, '日志清理成功')
  } catch (error) {
    next(error)
  }
}
