import type { Request, Response, NextFunction } from 'express'
import { noteService } from '@services/note'
import { success } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, keyword, reviewLevel } = req.query
    const data = await noteService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
      keyword: keyword as string,
      reviewLevel: reviewLevel !== undefined ? Number(reviewLevel) : undefined
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteService.create(req.body)
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteService.update(Number(req.params.id), req.body)
    success(res, data, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const submitForReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteService.submitForReview(Number(req.params.id))
    success(res, data, '提交审核成功')
  } catch (error) {
    next(error)
  }
}

export const audit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteService.audit(Number(req.params.id), req.body)
    success(res, data, '审核操作成功')
  } catch (error) {
    next(error)
  }
}

export const batchAudit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, ...data } = req.body
    await noteService.batchAudit(ids, data)
    success(res, null, '批量审核成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await noteService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const batchChangeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, status } = req.body
    await noteService.batchChangeStatus(ids, status)
    success(res, null, '批量状态更新成功')
  } catch (error) {
    next(error)
  }
}

export const hotList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const data = await noteService.getHotList({
      page: Number(page),
      pageSize: Number(pageSize)
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const stats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteService.getStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const trend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = 7 } = req.query
    const data = await noteService.getTrendData(Number(days))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const view = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteService.incrementView(Number(req.params.id))
    success(res, data, '浏览量增加成功')
  } catch (error) {
    next(error)
  }
}

export const like = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteService.incrementLike(Number(req.params.id))
    success(res, data, '点赞成功')
  } catch (error) {
    next(error)
  }
}

export const share = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteService.incrementShare(Number(req.params.id))
    success(res, data, '分享量增加成功')
  } catch (error) {
    next(error)
  }
}
