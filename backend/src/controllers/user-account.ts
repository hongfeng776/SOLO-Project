import type { Request, Response, NextFunction } from 'express'
import { userAccountService } from '@services/user-account'
import { success, paginate } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const checkPublishEligibility = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userAccountService.checkPublishEligibility(req.user!.userId)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getAccountStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userAccountService.checkAccountStatus(req.user!.userId)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getAbnormalLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, userId, abnormalType } = req.query
    const data = await userAccountService.getAbnormalLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      userId: userId !== undefined ? Number(userId) : undefined,
      abnormalType: abnormalType as string
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}
