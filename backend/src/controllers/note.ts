import type { Request, Response, NextFunction } from 'express'
import { noteService } from '@services/note'
import { success } from '@utils/response'

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
