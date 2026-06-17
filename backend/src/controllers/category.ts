import type { Request, Response, NextFunction } from 'express'
import { categoryService } from '@services/category'
import { success, AppError } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, status, parentId, level, format } = req.query

    if (format === 'tree') {
      const data = await categoryService.getTree({
        status: status !== undefined ? Number(status) : undefined,
        keyword: keyword as string
      })
      success(res, data)
      return
    }

    const data = await categoryService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
      keyword: keyword as string,
      parentId: parentId !== undefined ? Number(parentId) : undefined,
      level: level !== undefined ? Number(level) : undefined
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const tree = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await categoryService.getTree()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const all = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await categoryService.getAll()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await categoryService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validation = await categoryService.validateCategoryData(req.body)
    if (!validation.valid) {
      throw new AppError(JSON.stringify(validation.errors), 400)
    }
    const data = await categoryService.create(req.body, req.user!.userId)
    success(res, { id: data.id }, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validation = await categoryService.validateCategoryData(req.body, true)
    if (!validation.valid) {
      throw new AppError(JSON.stringify(validation.errors), 400)
    }
    await categoryService.update(Number(req.params.id), req.body, req.user!.userId)
    success(res, { id: Number(req.params.id) }, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await categoryService.remove(Number(req.params.id))
    success(res, { success: true }, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body
    await categoryService.updateStatus(Number(req.params.id), Number(status), req.user!.userId)
    success(res, { id: Number(req.params.id), status: Number(status) }, '状态更新成功')
  } catch (error) {
    next(error)
  }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await categoryService.getStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}
