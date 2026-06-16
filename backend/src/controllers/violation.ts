import type { Request, Response, NextFunction } from 'express'
import { violationService } from '@services/violation'
import { success } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, type, keyword, reporterId, targetId, targetType } = req.query
    const data = await violationService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
      type: type as string,
      keyword: keyword as string,
      reporterId: reporterId !== undefined ? Number(reporterId) : undefined,
      targetId: targetId !== undefined ? Number(targetId) : undefined,
      targetType: targetType as string
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await violationService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await violationService.create({
      ...req.body,
      reporterId: req.user!.userId
    })
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await violationService.handle(Number(req.params.id), req.body)
    success(res, data, '处理成功')
  } catch (error) {
    next(error)
  }
}

export const batchHandle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, ...data } = req.body
    await violationService.batchHandle(ids, data)
    success(res, null, '批量处理成功')
  } catch (error) {
    next(error)
  }
}

export const appeal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await violationService.appeal(Number(req.params.id), {
      ...req.body,
      userId: req.user!.userId
    })
    success(res, data, '申诉提交成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await violationService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await violationService.getStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}
