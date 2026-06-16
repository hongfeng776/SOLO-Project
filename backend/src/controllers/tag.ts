import type { Request, Response, NextFunction } from 'express'
import { tagService } from '@services/tag'
import { success } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, type, status, keyword } = req.query
    const data = await tagService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      type: type as string,
      status: status !== undefined ? Number(status) : undefined,
      keyword: keyword as string
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const all = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await tagService.all(req.query as { type?: string })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await tagService.create(req.body)
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await tagService.update(Number(req.params.id), req.body)
    success(res, data, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await tagService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}
