import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '@/types/index'
import rewardService from '@services/activity-reward'
import { success, paginate } from '@utils/response'
import type { RewardDifferentialFactor } from '@/enums/business'

const getOperatorInfo = (req: AuthenticatedRequest) => ({
  userId: req.user!.userId,
  username: req.user!.username,
  roles: req.user!.roles,
  permissions: req.user!.permissions,
  ip: req.ip,
  userAgent: req.headers['user-agent'] as string
})

// ==================== 功能点1：前置校验 ====================
export const validateIssue = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId, participationId, overrideAmount, overrideQuantity, differentialFactor, skipBudgetCheck } = req.query
    const rewardOverride: any = {}
    if (overrideAmount !== undefined) rewardOverride.rewardAmount = Number(overrideAmount)
    if (overrideQuantity !== undefined) rewardOverride.rewardQuantity = Number(overrideQuantity)
    const data = await rewardService.validateRewardIssue(
      Number(activityId),
      Number(participationId),
      getOperatorInfo(req),
      {
        rewardOverride: Object.keys(rewardOverride).length ? rewardOverride : undefined,
        differentialFactor: differentialFactor as RewardDifferentialFactor | undefined,
        skipBudgetCheck: skipBudgetCheck === 'true'
      }
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点2：创建待发放 + 预算锁定 + 执行发放 + 到账确认 ====================
export const createPending = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId, participationId, overrideAmount, overrideQuantity, differentialFactor, remark } = req.body
    const rewardOverride: any = {}
    if (overrideAmount !== undefined) rewardOverride.rewardAmount = Number(overrideAmount)
    if (overrideQuantity !== undefined) rewardOverride.rewardQuantity = Number(overrideQuantity)
    const data = await rewardService.createPending(
      Number(activityId),
      Number(participationId),
      getOperatorInfo(req),
      {
        rewardOverride: Object.keys(rewardOverride).length ? rewardOverride : undefined,
        differentialFactor: differentialFactor as RewardDifferentialFactor | undefined,
        remark
      }
    )
    success(res, data, '待发放记录创建成功')
  } catch (error) {
    next(error)
  }
}

export const lockBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await rewardService.lockBudget(Number(req.params.id), getOperatorInfo(req))
    success(res, data, '预算锁定成功')
  } catch (error) {
    next(error)
  }
}

export const issueReward = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountChannel, accountTargetId, transactionId, remark, skipBudgetLock } = req.body
    const data = await rewardService.issueReward(
      Number(req.params.id),
      getOperatorInfo(req),
      { accountChannel, accountTargetId, transactionId, remark, skipBudgetLock: Boolean(skipBudgetLock) }
    )
    success(res, data, '奖励发放成功')
  } catch (error) {
    next(error)
  }
}

export const confirmArrival = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { transactionId, remark } = req.body
    const data = await rewardService.confirmArrival(
      Number(req.params.id),
      getOperatorInfo(req),
      { transactionId, remark }
    )
    success(res, data, '到账确认成功')
  } catch (error) {
    next(error)
  }
}

export const reissueReward = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await rewardService.reissueReward(Number(req.params.id), getOperatorInfo(req))
    success(res, data, '奖励补发成功')
  } catch (error) {
    next(error)
  }
}

export const recycleReward = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason, violationType, remark } = req.body
    const violationDetail: any = {}
    if (reason) violationDetail.reason = reason
    const data = await rewardService.recycleReward(
      Number(req.params.id),
      getOperatorInfo(req),
      { violationType, violationDetail: Object.keys(violationDetail).length ? violationDetail : undefined, remark }
    )
    success(res, data, '奖励回收成功')
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点3：批量操作 ====================
export const batchIssue = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { participationIds, remark, accountChannel } = req.body
    const data = await rewardService.batchIssue(participationIds as number[], getOperatorInfo(req), { remark, accountChannel })
    success(res, data, `批量发放完成，成功 ${data.successCount}/${data.total}`)
  } catch (error) {
    next(error)
  }
}

export const batchReissue = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rewardIds } = req.body
    const data = await rewardService.batchReissue(rewardIds as number[], getOperatorInfo(req))
    success(res, data, `批量补发完成，成功 ${data.successCount}/${data.total}`)
  } catch (error) {
    next(error)
  }
}

export const batchRecycle = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rewardIds, violationType, remark } = req.body
    const data = await rewardService.batchRecycle(rewardIds as number[], getOperatorInfo(req), { violationType, remark })
    success(res, data, `批量回收完成，成功 ${data.successCount}/${data.total}`)
  } catch (error) {
    next(error)
  }
}

export const batchIssueDifferential = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, differentialFactor } = req.body
    const data = await rewardService.batchIssueDifferential(
      items as Array<{ participationId: number; rewardOverride?: { rewardAmount?: number; rewardQuantity?: number } }>,
      getOperatorInfo(req),
      differentialFactor as RewardDifferentialFactor | undefined
    )
    success(res, data, `差异化批量发放完成，成功 ${data.successCount}/${data.total}`)
  } catch (error) {
    next(error)
  }
}

// ==================== 基础 CRUD ====================
export const list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1, pageSize = 20,
      activityId, userId, status, violationType, reconcileStatus, keyword
    } = req.query
    const data = await rewardService.list({
      page: Number(page), pageSize: Number(pageSize),
      activityId: activityId !== undefined ? Number(activityId) : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      status: status !== undefined ? (Array.isArray(status) ? (status as any[]).map(Number) : Number(status)) : undefined,
      violationType: violationType as string,
      reconcileStatus: reconcileStatus !== undefined ? Number(reconcileStatus) : undefined,
      keyword: keyword as string
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await rewardService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点4：审计溯源 + 账目核对 ====================
export const auditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1, pageSize = 20,
      rewardId, userId, activityId, action, batchId
    } = req.query
    const data = await rewardService.getAuditLogs({
      page: Number(page), pageSize: Number(pageSize),
      rewardId: rewardId !== undefined ? Number(rewardId) : undefined,
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
    const data = await rewardService.getRewardTraceSnapshot(
      Number(id),
      auditLogId !== undefined ? Number(auditLogId) : undefined
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const reconcileAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId } = req.body
    const data = await rewardService.reconcileAccount(
      activityId !== undefined ? Number(activityId) : undefined,
      getOperatorInfo(req)
    )
    success(res, data, data.matched ? '账目核对完成，账实一致' : '账目核对完成，存在账实不符')
  } catch (error) {
    next(error)
  }
}

export const reconcileStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await rewardService.getReconcileStats(getOperatorInfo(req))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 用户侧：我的奖励 ====================
export const myRewards = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const data = await rewardService.getUserRewards(req.user!.userId, {
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}
