import type { Request, Response, NextFunction } from 'express'
import { orderService } from '@services/order'
import { success } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, type, status } = req.query
    const data = await orderService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword: keyword as string,
      type: type as string,
      status: status !== undefined ? Number(status) : undefined
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await orderService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await orderService.updateStatus(Number(req.params.id), req.body.status, req.body.remark)
    success(res, data, '状态更新成功')
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await orderService.create(req.body)
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await orderService.update(Number(req.params.id), req.body)
    success(res, data, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await orderService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const batchUpdateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, status, remark } = req.body
    await orderService.batchUpdateStatus(ids, status, remark)
    success(res, null, '批量状态更新成功')
  } catch (error) {
    next(error)
  }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await orderService.getStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}
