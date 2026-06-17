import type { Request, Response, NextFunction } from 'express'
import { reviewComplianceService } from '@services/review-compliance'
import { User } from '@models/index'
import { success, paginate, AppError } from '@utils/response'
import type { AuthenticatedRequest, ReviewActionData } from '@/types/index'
import { ReviewerLevel } from '@/enums/business'

export const validate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reviewerId, data } = req.body

    if (!reviewerId || !data) {
      throw new AppError('缺少必要参数: reviewerId 和 data', 400)
    }

    const result = await reviewComplianceService.validateReview(Number(reviewerId), data as ReviewActionData)
    success(res, result)
  } catch (error) {
    next(error)
  }
}

export const getAbnormalLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, reviewerId, handled } = req.query
    const data = await reviewComplianceService.getAbnormalLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      reviewerId: reviewerId !== undefined ? Number(reviewerId) : undefined,
      handled: handled !== undefined ? Number(handled) : undefined
    })
    paginate(res, data.list, data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}

export const handleAbnormal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { handleNote } = req.body
    const handlerId = req.user!.userId
    const handlerName = req.user!.username

    const user = await User.findByPk(handlerId)
    if (!user || (user.reviewLevel !== ReviewerLevel.SENIOR && user.isSeniorReviewer !== 1)) {
      throw new AppError('只有高级审核员可以处理异常审核日志', 403)
    }

    await reviewComplianceService.handleAbnormalLog(id, handlerId, handlerName, handleNote || '')
    success(res, null, '异常审核日志处理成功')
  } catch (error) {
    next(error)
  }
}
