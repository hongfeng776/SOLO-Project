import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '@/types/index'
import participationService from '@services/activity-participation'
import { success, paginate } from '@utils/response'

const getOperatorInfo = (req: AuthenticatedRequest) => ({
  userId: req.user!.userId,
  username: req.user!.username,
  roles: req.user!.roles,
  permissions: req.user!.permissions,
  ip: req.ip,
  userAgent: req.headers['user-agent'] as string
})

const getClientInfo = (req: AuthenticatedRequest) => ({
  deviceId: (req.headers['x-device-id'] as string) || (req.body?.deviceId),
  ip: req.ip,
  userAgent: req.headers['user-agent'] as string
})

// ==================== 功能点1：前置校验资格 ====================
export const validateEligibility = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId, userId } = req.query
    const targetUserId = userId ? Number(userId) : req.user!.userId
    const data = await participationService.validateParticipationEligibility(
      Number(activityId),
      targetUserId,
      getClientInfo(req)
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点2：用户报名 ====================
export const signUp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId, userId } = req.body
    const targetUserId = userId ? Number(userId) : req.user!.userId
    const data = await participationService.signUp(
      Number(activityId),
      targetUserId,
      getClientInfo(req),
      getOperatorInfo(req)
    )
    success(res, data, '报名成功')
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点2：提交任务完成 ====================
export const submitTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const data = await participationService.submitTask(
      Number(id),
      req.body?.taskDetail || req.body || {},
      getOperatorInfo(req)
    )
    success(res, data, '任务提交成功')
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点2：状态变更 ====================
export const changeStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const { status, remark, violationType, checkDimension } = req.body
    const data = await participationService.changeStatus(
      Number(id),
      Number(status),
      getOperatorInfo(req),
      { remark, violationType, checkDimension }
    )
    success(res, data, '状态更新成功')
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点3：批量操作 ====================
export const batchApprove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, remark } = req.body
    const data = await participationService.batchApprove(ids as number[], getOperatorInfo(req), { remark })
    success(res, data, `批量审核通过完成，成功 ${data.successCount}/${data.total}`)
  } catch (error) {
    next(error)
  }
}

export const batchReject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, remark, violationType } = req.body
    const data = await participationService.batchReject(ids as number[], getOperatorInfo(req), { remark, violationType })
    success(res, data, `批量审核拒绝完成，成功 ${data.successCount}/${data.total}`)
  } catch (error) {
    next(error)
  }
}

export const batchRemove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, remark, violationType } = req.body
    const data = await participationService.batchRemove(ids as number[], getOperatorInfo(req), { remark, violationType })
    success(res, data, `批量剔除完成，成功 ${data.successCount}/${data.total}`)
  } catch (error) {
    next(error)
  }
}

export const batchReset = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, remark } = req.body
    const data = await participationService.batchReset(ids as number[], getOperatorInfo(req), { remark })
    success(res, data, `批量重置完成，成功 ${data.successCount}/${data.total}`)
  } catch (error) {
    next(error)
  }
}

// ==================== 基础 CRUD ====================
export const list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      pageSize = 20,
      activityId,
      userId,
      status,
      isAnomaly,
      violationType,
      keyword
    } = req.query
    const data = await participationService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      activityId: activityId !== undefined ? Number(activityId) : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      status: status !== undefined ? (Array.isArray(status) ? (status as any[]).map(Number) : Number(status)) : undefined,
      isAnomaly: isAnomaly !== undefined ? Number(isAnomaly) : undefined,
      violationType: violationType as string,
      keyword: keyword as string
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await participationService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点4：审计溯源 ====================
export const auditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      pageSize = 20,
      participationId,
      userId,
      activityId,
      action,
      batchId
    } = req.query
    const data = await participationService.getAuditLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      participationId: participationId !== undefined ? Number(participationId) : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      activityId: activityId !== undefined ? Number(activityId) : undefined,
      action: action as string,
      batchId: batchId as string
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const traceSnapshot = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const { auditLogId } = req.query
    const data = await participationService.getParticipationTraceSnapshot(
      Number(id),
      auditLogId !== undefined ? Number(auditLogId) : undefined
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点4：清理无效数据 ====================
export const clearInvalid = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId, beforeDays } = req.body
    const data = await participationService.clearInvalidParticipations(
      getOperatorInfo(req),
      {
        activityId: activityId !== undefined ? Number(activityId) : undefined,
        beforeDays: beforeDays !== undefined ? Number(beforeDays) : undefined
      }
    )
    success(res, data, `已清理 ${data.clearedCount} 条无效参与数据`)
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点4：异常参与拦截统计 ====================
export const anomalyStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await participationService.getAnomalyStats(getOperatorInfo(req))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 用户活动中心：我的参与 ====================
export const myList = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const data = await participationService.getUserParticipationList(req.user!.userId, {
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}
