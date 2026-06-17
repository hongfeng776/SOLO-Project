import type { Request, Response, NextFunction } from 'express'
import { tagService } from '@services/tag-management'
import { success, AppError, fail } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, categoryId, type, status, hotLevel, isCore } = req.query
    const data = await tagService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword: keyword as string,
      categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
      type: type as string,
      status: status !== undefined ? Number(status) : undefined,
      hotLevel: hotLevel !== undefined ? Number(hotLevel) : undefined,
      isCore: isCore !== undefined ? Number(isCore) : undefined
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await tagService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validation = await tagService.validateTagForCreate(req.body)
    if (!validation.valid) {
      throw new AppError(JSON.stringify(validation.errors), 400)
    }

    const duplicateCheck = await tagService.checkDuplicate(req.body)
    if (duplicateCheck.exists) {
      throw new AppError(duplicateCheck.message || '标签已存在', 400)
    }

    const data = await tagService.createTag(req.body, req.user!.userId)
    success(res, { id: data.id }, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await tagService.updateTag(Number(req.params.id), req.body, req.user!.userId)
    success(res, { id: data.id }, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await tagService.removeTag(Number(req.params.id))
    success(res, { success: true }, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const toggleStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body
    const result = await tagService.toggleStatus(Number(req.params.id), Number(status), req.user!.userId)
    success(res, { id: result.id, status: result.status, message: '已联动更新分类统计' })
  } catch (error) {
    next(error)
  }
}

export const batchOperations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, action, weight } = req.body
    const userId = req.user!.userId
    const userRoles = req.user!.roles
    const data = await tagService.batchOperations(userId, userRoles, { ids, action, weight })
    success(res, data, '批量操作完成')
  } catch (error) {
    next(error)
  }
}

export const getUsageLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, tagId, noteId, userId, action, startTime, endTime } = req.query
    const data = await tagService.getUsageLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      tagId: tagId !== undefined ? Number(tagId) : undefined,
      noteId: noteId !== undefined ? Number(noteId) : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      action: action as string,
      startTime: startTime as string,
      endTime: endTime as string
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const cleanUnused = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRoles = req.user!.roles
    const hasPermission = userRoles.some(role => role === 'admin' || role === 'super_ops')
    if (!hasPermission) {
      fail(res, '无权限访问该资源', 403)
      return
    }
    const { thresholdDays } = req.body
    const data = await tagService.cleanUnused(Number(thresholdDays), req.user!.userId)
    success(res, data, '清理完成')
  } catch (error) {
    next(error)
  }
}

export const getReviewReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = 30 } = req.query
    const data = await tagService.getReviewReport(Number(days))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const validateBeforeCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await tagService.validateTagForCreate(req.body, true)
    success(res, data)
  } catch (error) {
    next(error)
  }
}
