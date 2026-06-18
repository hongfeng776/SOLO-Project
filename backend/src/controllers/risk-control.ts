import type { Response, NextFunction } from 'express'
import { riskControlService } from '@services/risk-control'
import { success, paginate } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

const getOperatorInfo = (req: AuthenticatedRequest) => ({
  userId: req.user!.userId,
  username: req.user!.username,
  roles: req.user!.roles,
  permissions: req.user!.permissions
})

export const getBehaviorLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, userId, behaviorType, isAbnormal, riskLevel, startDate, endDate } = req.query
    const data = await riskControlService.getBehaviorLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      userId: userId !== undefined ? Number(userId) : undefined,
      behaviorType: behaviorType as string,
      isAbnormal: isAbnormal !== undefined ? Number(isAbnormal) : undefined,
      riskLevel: riskLevel !== undefined ? Number(riskLevel) : undefined,
      startTime: startDate as string,
      endTime: endDate as string
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const getRiskControlList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, userId, riskLevel, violationType, intercepted, startDate, endDate } = req.query
    const data = await riskControlService.getRiskControlList({
      page: Number(page),
      pageSize: Number(pageSize),
      userId: userId !== undefined ? Number(userId) : undefined,
      riskLevel: riskLevel !== undefined ? Number(riskLevel) : undefined,
      violationType: violationType as string,
      intercepted: intercepted !== undefined ? Number(intercepted) : undefined,
      startTime: startDate as string,
      endTime: endDate as string
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const getUserRiskDetail = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await riskControlService.getUserRiskDetail(Number(req.params.id))
    success(_res, data)
  } catch (error) {
    next(error)
  }
}

export const detectAnomaly = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { behaviorType = 'all' } = req.body
    const data = await riskControlService.detectAnomaly(
      Number(req.params.id),
      behaviorType as string
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const interceptBehavior = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { behaviorType, reason } = req.body
    const data = await riskControlService.interceptBehavior(
      Number(req.params.id),
      `${behaviorType}: ${reason}`,
      getOperatorInfo(req)
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getPunishmentList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, userId, punishmentType, status, riskLevel, startDate, endDate } = req.query
    const data = await riskControlService.getPunishmentList({
      page: Number(page),
      pageSize: Number(pageSize),
      userId: userId !== undefined ? Number(userId) : undefined,
      punishmentType: punishmentType as string,
      status: status !== undefined ? Number(status) : undefined,
      riskLevel: riskLevel !== undefined ? Number(riskLevel) : undefined,
      startTime: startDate as string,
      endTime: endDate as string
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const applyPunishment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { punishmentType, reason, reasonDetail } = req.body
    const userId = Number(req.params.id)
    const riskLevelMap: Record<string, number> = {
      warning: 1, temp_restrict: 1,
      flow_limit: 2, content_downgrade: 2,
      temp_ban: 3, permanent_ban: 3
    }
    const riskLevel = riskLevelMap[punishmentType] || 1
    const data = await riskControlService.applyPunishment(
      userId,
      riskLevel,
      reasonDetail || reason,
      getOperatorInfo(req)
    )
    success(res, { success: data.success, message: '处罚已应用', punishments: data.punishments })
  } catch (error) {
    next(error)
  }
}

export const revokePunishment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reason } = req.body
    const recordId = Number(req.params.id)
    const data = await riskControlService.revokePunishment(
      recordId,
      reason,
      getOperatorInfo(req)
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const batchHandlePunishment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userIds, action, reason } = req.body
    const data = await riskControlService.batchHandlePunishment(
      { userIds: userIds as number[], action: action as 'release_minor' | 'ban_severe', reason: reason as string },
      getOperatorInfo(req)
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getViolationTrace = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await riskControlService.getViolationTrace(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const validatePunishment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await riskControlService.validatePunishment(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const generateReviewReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await riskControlService.generateReviewReport(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}
