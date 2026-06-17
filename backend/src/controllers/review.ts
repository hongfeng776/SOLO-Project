import type { Request, Response, NextFunction } from 'express'
import { reviewQueueService } from '@services/review-queue'
import { reviewService } from '@services/review'
import { User } from '@models/index'
import { success, paginate, AppError } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const getQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, reviewLevel, noteType, keyword } = req.query
    const data = await reviewQueueService.getReviewQueue({
      page: Number(page),
      pageSize: Number(pageSize),
      reviewLevel: reviewLevel !== undefined ? Number(reviewLevel) : undefined,
      noteType: noteType !== undefined ? Number(noteType) : undefined,
      keyword: keyword as string
    })
    paginate(res, data.list, data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}

export const getHighRiskCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reviewLevel } = req.query
    const data = await reviewQueueService.getHighRiskCount(
      reviewLevel !== undefined ? Number(reviewLevel) : undefined
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const executeReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { noteId, action, violationType, reason } = req.body
    const reviewerId = req.user!.userId
    const reviewerName = req.user!.username

    if (!noteId || !action) {
      throw new AppError('缺少必要参数: noteId 和 action', 400)
    }

    const data = await reviewService.executeReview(reviewerId, reviewerName, {
      noteId: Number(noteId),
      action: Number(action),
      violationType,
      reason
    })

    success(res, data, '审核操作成功')
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else {
      next(error)
    }
  }
}

export const batchReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, action, violationType, reason } = req.body
    const reviewerId = req.user!.userId
    const reviewerName = req.user!.username

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('缺少必要参数: ids 必须是非空数组', 400)
    }

    if (!action) {
      throw new AppError('缺少必要参数: action', 400)
    }

    const user = await User.findByPk(reviewerId)
    const reviewerLevel = user?.reviewLevel || 1

    const data = await reviewService.batchReview(reviewerId, reviewerName, reviewerLevel, {
      noteIds: ids.map((id: number) => Number(id)),
      action: Number(action),
      violationType,
      reason
    })

    success(res, data, '批量审核操作完成')
  } catch (error) {
    next(error)
  }
}

export const doubleClickReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const noteId = Number(req.params.id)
    const reviewerId = req.user!.userId
    const reviewerName = req.user!.username

    const data = await reviewService.performDoubleClickReview(reviewerId, reviewerName, noteId)
    success(res, data, '双击审核操作成功')
  } catch (error) {
    next(error)
  }
}
