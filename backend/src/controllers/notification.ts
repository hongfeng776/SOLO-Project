import type { Request, Response, NextFunction } from 'express'
import { notificationService } from '@services/notification'
import { success } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, type, isRead } = req.query
    const data = await notificationService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      type: type as string,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      userId: req.user!.userId
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await notificationService.detail(Number(req.params.id), req.user!.userId)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await notificationService.create(req.body)
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await notificationService.markAsRead(Number(req.params.id), req.user!.userId)
    success(res, data, '标记已读成功')
  } catch (error) {
    next(error)
  }
}

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.markAllAsRead(req.user!.userId)
    success(res, null, '全部标记已读成功')
  } catch (error) {
    next(error)
  }
}

export const unreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await notificationService.getUnreadCount(req.user!.userId)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.remove(Number(req.params.id), req.user!.userId)
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}
