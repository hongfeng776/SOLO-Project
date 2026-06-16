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
