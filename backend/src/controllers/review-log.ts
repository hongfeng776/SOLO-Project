import type { Request, Response, NextFunction } from 'express'
import { reviewLogService } from '@services/review-log'
import { success, paginate } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, noteId, reviewerId, action, startTime, endTime } = req.query
    const data = await reviewLogService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      noteId: noteId !== undefined ? Number(noteId) : undefined,
      reviewerId: reviewerId !== undefined ? Number(reviewerId) : undefined,
      action: action !== undefined ? Number(action) : undefined,
      startTime: startTime as string,
      endTime: endTime as string
    })
    paginate(res, data.list, data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await reviewLogService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getNoteHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const noteId = Number(req.params.noteId)
    const data = await reviewLogService.getNoteReviewHistory(noteId)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getReviewerStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviewerId = Number(req.params.reviewerId)
    const { days = 7 } = req.query
    const data = await reviewLogService.getReviewerStats(reviewerId, Number(days))
    success(res, data)
  } catch (error) {
    next(error)
  }
}
