import type { Request, Response, NextFunction } from 'express'
import { roleService } from '@services/role'
import { success } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query
    const data = await roleService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword: keyword as string,
      status: status !== undefined ? Number(status) : undefined
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const all = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await roleService.all()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await roleService.create(req.body)
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await roleService.update(Number(req.params.id), req.body)
    success(res, data, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await roleService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}
