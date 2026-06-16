import type { Request, Response, NextFunction } from 'express'
import { creatorService } from '@services/creator'
import { success } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, level, qualificationStatus } = req.query
    const data = await creatorService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword: keyword as string,
      level: level !== undefined ? Number(level) : undefined,
      qualificationStatus: qualificationStatus !== undefined ? Number(qualificationStatus) : undefined
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorService.create(req.body)
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorService.update(Number(req.params.id), req.body)
    success(res, data, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const auditQualification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorService.auditQualification(Number(req.params.id), req.body.qualificationStatus)
    success(res, data, '审核成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await creatorService.remove(Number(req.params.id))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}
