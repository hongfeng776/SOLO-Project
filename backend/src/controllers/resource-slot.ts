import type { Request, Response, NextFunction } from 'express'
import { resourceSlotService } from '@services/resource-slot'
import { success } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, type, keyword } = req.query
    const data = await resourceSlotService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
      type: type as string,
      keyword: keyword as string
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await resourceSlotService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await resourceSlotService.create(req.body)
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await resourceSlotService.update(Number(req.params.id), req.body)
    success(res, data, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await resourceSlotService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await resourceSlotService.updateStatus(Number(req.params.id), req.body.status)
    success(res, data, '状态更新成功')
  } catch (error) {
    next(error)
  }
}
