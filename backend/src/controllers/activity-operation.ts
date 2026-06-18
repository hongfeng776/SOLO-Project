import type { Response, NextFunction } from 'express'
import { activityOperationService } from '@services/activity-operation'
import { success, paginate } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

const getOperatorInfo = (req: AuthenticatedRequest) => ({
  userId: req.user!.userId,
  username: req.user!.username,
  roles: req.user!.roles,
  permissions: req.user!.permissions
})

export const getActivityList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, activityLevel, minScore, maxScore, uid, startDate, endDate } = req.query
    const data = await activityOperationService.getActivityList({
      page: Number(page),
      pageSize: Number(pageSize),
      activityLevel: activityLevel !== undefined ? Number(activityLevel) : undefined,
      minScore: minScore !== undefined ? Number(minScore) : undefined,
      maxScore: maxScore !== undefined ? Number(maxScore) : undefined,
      uid: uid !== undefined ? Number(uid) : undefined,
      updateStartDate: startDate as string,
      updateEndDate: endDate as string
    }, getOperatorInfo(req))
    paginate(res, data.list, data.total, Number(page), Number(pageSize), { permission: data.permission })
  } catch (error) {
    next(error)
  }
}

export const getUserActivityDetail = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await activityOperationService.getUserActivityDetail(
      Number(req.params.id),
      getOperatorInfo(req)
    )
    success(_res, data)
  } catch (error) {
    next(error)
  }
}

export const calculateActivityScore = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await activityOperationService.calculateActivityScore(
      Number(req.params.id)
    )
    success(res, data, '活跃度分值计算完成')
  } catch (error) {
    next(error)
  }
}

export const validateFilterConditions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conditions } = req.body
    const data = await activityOperationService.validateFilterConditions(
      conditions as Record<string, unknown>
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const refreshActivityData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await activityOperationService.refreshActivityData(
      Number(req.params.id),
      getOperatorInfo(req)
    )
    success(res, data, '活跃度数据刷新成功')
  } catch (error) {
    next(error)
  }
}

export const getStrategies = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await activityOperationService.getStrategies()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const updateStrategy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await activityOperationService.updateStrategy(
      Number(req.params.id),
      req.body,
      getOperatorInfo(req)
    )
    success(res, data, '策略配置更新成功')
  } catch (error) {
    next(error)
  }
}

export const getUserStrategies = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await activityOperationService.getUserStrategies(
      Number(req.params.id),
      getOperatorInfo(req)
    )
    success(_res, data)
  } catch (error) {
    next(error)
  }
}

export const batchExecuteOperation = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { operationType, userIds, strategyIds, executeType, scheduledTime, remark } = req.body
    const data = await activityOperationService.batchExecuteOperation({
      operationType: operationType as 'wake_up_sleeping' | 'grant_benefit_high' | 'mark_focus_low' | 'send_push_notify',
      userIds: userIds as number[],
      strategyIds: strategyIds as number[] | undefined,
      executeType: (executeType || 'immediate') as 'immediate' | 'scheduled',
      scheduledTime: scheduledTime ? new Date(scheduledTime as string) : undefined,
      remark: remark as string | undefined
    }, getOperatorInfo(req))
    success(_res, data, `批量操作完成，成功${data.success}个，失败${data.fail}个`)
  } catch (error) {
    next(error)
  }
}

export const getActivityScoreLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, userId, logType, isAbnormal, startDate, endDate, operatorId } = req.query
    const data = await activityOperationService.getActivityScoreLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      userId: userId !== undefined ? Number(userId) : undefined,
      logType: logType as string,
      isAbnormal: isAbnormal !== undefined ? Number(isAbnormal) : undefined,
      startTime: startDate as string,
      endTime: endDate as string,
      operatorId: operatorId !== undefined ? Number(operatorId) : undefined
    }, getOperatorInfo(req))
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const detectAbnormalActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await activityOperationService.detectAbnormalActivity(
      Number(req.params.id)
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const generateAbnormalWarningList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, abnormalType, activityLevel } = req.query
    const data = await activityOperationService.generateAbnormalWarningList({
      page: Number(page),
      pageSize: Number(pageSize),
      abnormalType: abnormalType as string,
      activityLevel: activityLevel !== undefined ? Number(activityLevel) : undefined
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const validateActivityData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await activityOperationService.validateActivityData(
      Number(req.params.id)
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}
