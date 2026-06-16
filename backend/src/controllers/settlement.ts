import type { Request, Response, NextFunction } from 'express'
import { settlementService } from '@services/settlement'
import { success } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, type, keyword, creatorId, startTime, endTime } = req.query
    const data = await settlementService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
      type: type as string,
      keyword: keyword as string,
      creatorId: creatorId !== undefined ? Number(creatorId) : undefined,
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
    const data = await settlementService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await settlementService.create({
      ...req.body,
      creatorId: req.user!.userId
    })
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const settle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await settlementService.settle(Number(req.params.id))
    success(res, data, '结算成功')
  } catch (error) {
    next(error)
  }
}

export const reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await settlementService.reject(Number(req.params.id), req.body.reason)
    success(res, data, '驳回成功')
  } catch (error) {
    next(error)
  }
}

export const batchSettle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    await settlementService.batchSettle(ids)
    success(res, null, '批量结算成功')
  } catch (error) {
    next(error)
  }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await settlementService.getStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}
