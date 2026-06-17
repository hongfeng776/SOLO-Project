import type { Request, Response, NextFunction } from 'express'
import { userAccountService } from '@services/user-account'
import { success, paginate } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

const getOperatorInfo = (req: AuthenticatedRequest) => ({
  userId: req.user!.userId,
  username: req.user!.username,
  roles: req.user!.roles,
  permissions: req.user!.permissions
})

export const queryUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, uid, phone, nickname, registerSource, realNameVerified, phoneVerified, registerStartDate, registerEndDate, filterType } = req.query
    const data = await userAccountService.queryUsers({
      page: Number(page),
      pageSize: Number(pageSize),
      uid: uid !== undefined ? Number(uid) : undefined,
      phone: phone as string,
      nickname: nickname as string,
      registerSource: registerSource as string,
      realNameVerified: realNameVerified !== undefined ? Number(realNameVerified) : undefined,
      phoneVerified: phoneVerified !== undefined ? Number(phoneVerified) : undefined,
      registerStartDate: registerStartDate as string,
      registerEndDate: registerEndDate as string,
      filterType: filterType as string
    }, getOperatorInfo(req))
    paginate(res, data.list, data.total, Number(page), Number(pageSize), { permission: data.permission })
  } catch (error) {
    next(error)
  }
}

export const getUserDetail = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userAccountService.getUserDetail(Number(req.params.id), getOperatorInfo(req))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const preCheckUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userAccountService.preCheckUser(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const validatePhone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone } = req.body
    const data = await userAccountService.validatePhone(phone as string)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const validateNickname = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nickname, excludeUserId } = req.body
    const data = await userAccountService.validateNickname(
      nickname as string,
      excludeUserId !== undefined ? Number(excludeUserId) : undefined
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const validateAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { avatar } = req.body
    const data = await userAccountService.validateAvatar(avatar as string)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const updateUserInfo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userAccountService.updateUserInfo(
      Number(req.params.id),
      req.body,
      getOperatorInfo(req)
    )
    success(res, data, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const batchUpdateUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userAccountService.batchUpdateUsers(
      req.body,
      getOperatorInfo(req)
    )
    success(res, data, '批量更新完成')
  } catch (error) {
    next(error)
  }
}

export const batchResetConfig = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userAccountService.batchResetConfig(
      req.body,
      getOperatorInfo(req)
    )
    success(res, data, '批量重置完成')
  } catch (error) {
    next(error)
  }
}

export const traceUserAccount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userAccountService.traceUserAccount(
      Number(req.params.id),
      getOperatorInfo(req)
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const checkUserIntegrity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userAccountService.checkUserIntegrity(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getAbnormalUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, abnormalType, handled } = req.query
    const data = await userAccountService.getAbnormalUsers({
      page: Number(page),
      pageSize: Number(pageSize),
      abnormalType: abnormalType as string,
      handled: handled !== undefined ? Number(handled) : undefined
    }, getOperatorInfo(req))
    paginate(res, data.list, data.total, Number(page), Number(pageSize), { stats: data.stats, permission: data.permission })
  } catch (error) {
    next(error)
  }
}

export const handleAbnormalLog = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { handleResult, handled } = req.body
    const data = await userAccountService.handleAbnormalLog(
      Number(req.params.id),
      { handleResult: handleResult as string, handled: handled as number | undefined },
      getOperatorInfo(req)
    )
    success(res, data, '处理成功')
  } catch (error) {
    next(error)
  }
}

export const getAccountLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, userId, logType } = req.query
    const data = await userAccountService.getAccountLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      userId: userId !== undefined ? Number(userId) : undefined,
      logType: logType as string
    }, getOperatorInfo(req))
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

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
