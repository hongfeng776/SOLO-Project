import type { Response, NextFunction } from 'express'
import { userLevelService } from '@services/user-level'
import { success, paginate } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

const getOperatorInfo = (req: AuthenticatedRequest) => ({
  userId: req.user!.userId,
  username: req.user!.username,
  roles: req.user!.roles,
  permissions: req.user!.permissions
})

export const getLevelList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, uid, userLevel, minScore, maxScore, isPermanentBanned, updateStartDate, updateEndDate, nickname, status } = req.query
    const data = await userLevelService.getLevelList({
      page: Number(page),
      pageSize: Number(pageSize),
      uid: uid !== undefined ? Number(uid) : undefined,
      userLevel: userLevel !== undefined ? Number(userLevel) : undefined,
      minScore: minScore !== undefined ? Number(minScore) : undefined,
      maxScore: maxScore !== undefined ? Number(maxScore) : undefined,
      isPermanentBanned: isPermanentBanned !== undefined ? Number(isPermanentBanned) : undefined,
      updateStartDate: updateStartDate as string,
      updateEndDate: updateEndDate as string,
      nickname: nickname as string,
      status: status !== undefined ? Number(status) : undefined
    }, getOperatorInfo(req))
    paginate(res, data.list, data.total, Number(page), Number(pageSize), { permission: data.permission })
  } catch (error) {
    next(error)
  }
}

export const getUserLevelDetail = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userLevelService.getUserLevelDetail(
      Number(req.params.id),
      getOperatorInfo(req)
    )
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
    const data = await userLevelService.preCheckUser(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const calculateLevelScore = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userLevelService.calculateLevelScore(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const autoCalculateLevel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userLevelService.autoCalculateLevel(
      Number(req.params.id)
    )
    success(res, data, '等级自动计算完成')
  } catch (error) {
    next(error)
  }
}

export const adjustLevel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetLevel, reason, reasonDetail } = req.body
    const data = await userLevelService.adjustLevel(
      Number(req.params.id),
      Number(targetLevel),
      reason as string,
      reasonDetail as string | undefined,
      getOperatorInfo(req)
    )
    success(res, data, '等级调整成功')
  } catch (error) {
    next(error)
  }
}

export const validateLevelAdjustment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetLevel } = req.body
    const data = await userLevelService.validateLevelAdjustment(
      Number(req.params.id),
      Number(req.body.currentLevel),
      Number(targetLevel),
      getOperatorInfo(req).userId
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const batchAdjustLevel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userIds, targetLevel, reason, reasonDetail } = req.body
    const data = await userLevelService.batchAdjustLevel(
      userIds as number[],
      Number(targetLevel),
      reason as string,
      reasonDetail as string | undefined,
      getOperatorInfo(req)
    )
    success(res, data, `批量操作完成，成功${data.success}个，失败${data.fail}个`)
  } catch (error) {
    next(error)
  }
}

export const getLevelLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, userId, operationType, reason, startDate, endDate, operatorId } = req.query
    const data = await userLevelService.getLevelLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      userId: userId !== undefined ? Number(userId) : undefined,
      operationType: operationType as string,
      reason: reason as string,
      startTime: startDate as string,
      endTime: endDate as string,
      operatorId: operatorId !== undefined ? Number(operatorId) : undefined
    }, getOperatorInfo(req))
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const analyzeLevelChange = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userLevelService.analyzeLevelChange(
      Number(req.params.userId),
      Number(req.params.logId)
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getLevelConfigs = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userLevelService.getConfigs()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const updateLevelConfig = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await userLevelService.updateConfig(req.body)
    success(res, data, '配置更新成功')
  } catch (error) {
    next(error)
  }
}
