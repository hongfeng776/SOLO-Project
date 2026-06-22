import {
  Activity,
  ActivityParticipation,
  ActivityReward,
  ActivityRewardAuditLog,
  User,
  UserAccountLog
} from '@/models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import sequelize from '@config/database'
import {
  RewardStatus,
  REWARD_STATUS_NAMES,
  REWARD_STATUS_COLORS,
  RewardCheckDimension,
  REWARD_CHECK_DIMENSION_NAMES,
  CheckResultLevel,
  CHECK_RESULT_LEVEL_NAMES,
  RewardAuditAction,
  REWARD_AUDIT_ACTION_NAMES,
  RewardDifferentialFactor,
  REWARD_DIFFERENTIAL_FACTOR_NAMES,
  RewardReconcileStatus,
  REWARD_RECONCILE_STATUS_NAMES,
  REWARD_ISSUE_CONSTRAINTS,
  ParticipationStatus,
  TaskCompletionStatus,
  REWARD_TYPE_NAMES
} from '@/enums/business'

interface OperatorInfo {
  userId: number
  username: string
  roles: string[]
  permissions: string[]
  ip?: string
  userAgent?: string
}

interface CheckResultItem {
  dimension: string
  dimensionName: string
  level: string
  levelName: string
  message: string
  field?: string
  suggestion?: string
}

interface RewardRule {
  id?: string
  name: string
  rewardType: string
  rewardAmount: number
  rewardValue?: number
  condition: string
  conditionValue: number
  quota?: number
  probability?: number
  description?: string
  differentialConfig?: Record<string, any>
}

const safeJSONParse = <T = any>(str: any, defaultValue: T): T => {
  if (!str) return defaultValue
  if (typeof str === 'object') return str as T
  try {
    return JSON.parse(str) as T
  } catch {
    return defaultValue
  }
}

const genRewardNo = (): string => {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `RWD${ts}${rand}`
}

const genBatchId = (): string => {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `BATCH_RWD_${ts}_${rand}`
}

const computeChangedFields = (oldData: Record<string, any>, newData: Record<string, any>): string[] => {
  const fields: string[] = []
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})])
  for (const k of allKeys) {
    if (JSON.stringify(oldData?.[k]) !== JSON.stringify(newData?.[k])) {
      fields.push(k)
    }
  }
  return fields
}

const rewardSnapshot = (r: ActivityReward): Record<string, any> => {
  return {
    id: r.id,
    rewardNo: r.rewardNo,
    activityId: r.activityId,
    activityName: r.activityName,
    participationId: r.participationId,
    userId: r.userId,
    username: r.username,
    nickname: r.nickname,
    rewardType: r.rewardType,
    rewardTypeName: r.rewardTypeName,
    rewardName: r.rewardName,
    rewardAmount: Number(r.rewardAmount) || 0,
    rewardQuantity: r.rewardQuantity,
    differentialFactor: r.differentialFactor,
    differentialValue: Number(r.differentialValue) || 0,
    status: r.status,
    budgetLockedTime: r.budgetLockedTime,
    issueTime: r.issueTime,
    arriveTime: r.arriveTime,
    failTime: r.failTime,
    recycleTime: r.recycleTime,
    failReason: r.failReason,
    accountChannel: r.accountChannel,
    accountTargetId: r.accountTargetId,
    transactionId: r.transactionId,
    checkDimension: r.checkDimension,
    checkLevel: r.checkLevel,
    checkMessage: r.checkMessage,
    violationType: r.violationType,
    reconcileStatus: r.reconcileStatus,
    reconcileRemark: r.reconcileRemark,
    expireTime: r.expireTime,
    remark: r.remark,
    operatorId: r.operatorId,
    operatorName: r.operatorName,
    batchId: r.batchId
  }
}

const decorateReward = (r: ActivityReward): any => {
  const data = (r as any).toJSON ? (r as any).toJSON() : { ...r }
  data.statusName = REWARD_STATUS_NAMES[data.status ?? RewardStatus.PENDING_ISSUE] ?? ''
  data.statusColor = REWARD_STATUS_COLORS[data.status ?? RewardStatus.PENDING_ISSUE] ?? ''
  data.rewardTypeName = REWARD_TYPE_NAMES[data.rewardType] ?? data.rewardType ?? ''
  data.differentialFactorName = data.differentialFactor ? REWARD_DIFFERENTIAL_FACTOR_NAMES[data.differentialFactor] ?? '' : ''
  data.reconcileStatusName = REWARD_RECONCILE_STATUS_NAMES[data.reconcileStatus ?? RewardReconcileStatus.PENDING] ?? ''
  data.rewardAmount = Number(data.rewardAmount) || 0
  data.differentialValue = Number(data.differentialValue) || 0
  data.participantSnapshot = safeJSONParse(data.participantSnapshot, null)
  data.taskSnapshot = safeJSONParse(data.taskSnapshot, null)
  data.rewardRulesSnapshot = safeJSONParse<RewardRule[]>(data.rewardRulesSnapshot, [])
  data.violationDetail = safeJSONParse(data.violationDetail, null)
  return data
}

class ActivityRewardService {
  // ==================== 内部工具：写入审计日志 ====================
  private async _writeAudit(params: {
    rewardId: number
    rewardNo: string
    activityId: number
    activityName: string
    userId: number
    username: string
    action: RewardAuditAction
    operator?: OperatorInfo
    oldData?: Record<string, any>
    newData?: Record<string, any>
    changedFields?: string[]
    checkDimension?: string
    checkLevel?: string
    checkMessage?: string
    violationType?: string
    violationDetail?: Record<string, any>
    batchId?: string
    remark?: string
  }) {
    await ActivityRewardAuditLog.create({
      rewardId: params.rewardId,
      rewardNo: params.rewardNo,
      activityId: params.activityId,
      activityName: params.activityName,
      userId: params.userId,
      username: params.username,
      action: params.action,
      actionName: REWARD_AUDIT_ACTION_NAMES[params.action] ?? '',
      operatorId: params.operator?.userId,
      operatorName: params.operator?.username,
      oldData: params.oldData ? JSON.stringify(params.oldData) : null,
      newData: params.newData ? JSON.stringify(params.newData) : null,
      changedFields: params.changedFields ? JSON.stringify(params.changedFields) : null,
      oldAmount: params.oldData ? Number(params.oldData.rewardAmount) || 0 : null,
      newAmount: params.newData ? Number(params.newData.rewardAmount) || 0 : null,
      checkDimension: params.checkDimension || '',
      checkLevel: params.checkLevel || '',
      checkMessage: params.checkMessage || '',
      violationType: params.violationType || '',
      violationDetail: params.violationDetail ? JSON.stringify(params.violationDetail) : null,
      ip: params.operator?.ip || '',
      userAgent: params.operator?.userAgent || '',
      batchId: params.batchId || '',
      remark: params.remark || '',
      createTime: new Date()
    } as any)
  }

  // ==================== 内部工具：获取活动预算使用情况 ====================
  private async _getActivityBudgetUsage(activityId: number): Promise<{
    budget: number
    lockedAmount: number
    issuedAmount: number
    arrivedAmount: number
    remainingBudget: number
    usageRatio: number
    warn: boolean
    overBudget: boolean
  }> {
    const activity = await Activity.findByPk(activityId)
    const budget = activity ? Number(activity.rewardBudget) || 0 : 0

    const [lockedResult, issuedResult, arrivedResult] = await Promise.all([
      ActivityReward.sum('rewardAmount', {
        where: {
          activityId,
          status: { [Op.in]: [RewardStatus.LOCKED, RewardStatus.ISSUED] }
        }
      } as any),
      ActivityReward.sum('rewardAmount', {
        where: {
          activityId,
          status: { [Op.in]: [RewardStatus.ISSUED, RewardStatus.ARRIVED] }
        }
      } as any),
      ActivityReward.sum('rewardAmount', {
        where: {
          activityId,
          status: RewardStatus.ARRIVED
        }
      } as any)
    ])

    const lockedAmount = Number(lockedResult) || 0
    const issuedAmount = Number(issuedResult) || 0
    const arrivedAmount = Number(arrivedResult) || 0
    const remainingBudget = Math.max(0, budget - lockedAmount)
    const usageRatio = budget > 0 ? lockedAmount / budget : 0
    const warn = usageRatio >= REWARD_ISSUE_CONSTRAINTS.BUDGET_USAGE_WARN_RATIO
    const overBudget = remainingBudget <= 0

    return { budget, lockedAmount, issuedAmount, arrivedAmount, remainingBudget, usageRatio, warn, overBudget }
  }

  // ==================== 内部工具：解析奖励规则（差异化计算） ====================
  private _resolveRewardFromRules(
    rules: RewardRule[],
    participant: Record<string, any>,
    taskDetail: Record<string, any>,
    options: { factor?: RewardDifferentialFactor; overrides?: Partial<RewardRule> } = {}
  ): { rule: RewardRule; finalAmount: number; factor: string; factorValue: number } | null {
    if (!rules || rules.length === 0) return null

    const matchedRule = rules.find(r => {
      if (r.condition === 'always') return true
      if (r.condition === 'user_level') {
        return Number(participant.userLevel || 0) >= Number(r.conditionValue || 0)
      }
      if (r.condition === 'activity_level') {
        return Number(participant.activityLevel || 0) >= Number(r.conditionValue || 0)
      }
      if (r.condition === 'task_score') {
        return Number(taskDetail.score || 0) >= Number(r.conditionValue || 0)
      }
      return false
    }) || rules[0]

    let baseAmount = Number(matchedRule.rewardAmount) || 0
    if (options.overrides?.rewardAmount !== undefined) {
      baseAmount = Number(options.overrides.rewardAmount) || 0
    }

    let factorValue = 1
    let factor = ''

    if (options.factor) {
      factor = options.factor
      const diffConfig = matchedRule.differentialConfig || {}
      if (options.factor === RewardDifferentialFactor.USER_LEVEL) {
        const levelMultipliers = diffConfig.userLevelMultipliers || {}
        factorValue = Number(levelMultipliers[participant.userLevel || 0]) || 1
      } else if (options.factor === RewardDifferentialFactor.ACTIVITY_LEVEL) {
        const levelMultipliers = diffConfig.activityLevelMultipliers || {}
        factorValue = Number(levelMultipliers[participant.activityLevel || 0]) || 1
      } else if (options.factor === RewardDifferentialFactor.TASK_SCORE) {
        const scoreRanges = diffConfig.scoreRanges || []
        for (const range of scoreRanges) {
          if (Number(taskDetail.score || 0) >= Number(range.min || 0) && Number(taskDetail.score || 0) <= Number(range.max || 100)) {
            factorValue = Number(range.multiplier) || 1
            break
          }
        }
      }
    }

    if (options.overrides?.differentialConfig) {
      const overrideMultiplier = Number((options.overrides.differentialConfig as any).multiplier)
      if (overrideMultiplier > 0) {
        factorValue = overrideMultiplier
      }
    }

    const finalAmount = Number((baseAmount * factorValue).toFixed(2))

    return { rule: matchedRule, finalAmount, factor, factorValue }
  }

  // ==================== 功能点1：奖励发放前置校验（13维度全量校验） ====================
  async validateRewardIssue(
    activityId: number,
    participationId: number,
    _operator?: OperatorInfo,
    options: { skipBudgetCheck?: boolean; rewardOverride?: Partial<RewardRule>; differentialFactor?: RewardDifferentialFactor } = {}
  ): Promise<{
    eligible: boolean
    passed: boolean
    hasBlocker: boolean
    hasError: boolean
    results: CheckResultItem[]
    fieldErrors: Record<string, string>
    rewardPlan?: { rule: RewardRule; finalAmount: number; factor: string; factorValue: number }
    activitySnapshot?: any
    participantSnapshot?: any
    taskSnapshot?: any
    budgetUsage?: any
  }> {
    const results: CheckResultItem[] = []
    const fieldErrors: Record<string, string> = {}
    let hasBlocker = false
    let hasError = false

    const [activity, participation] = await Promise.all([
      Activity.findByPk(activityId),
      ActivityParticipation.findByPk(participationId)
    ])

    if (!activity) {
      results.push({
        dimension: RewardCheckDimension.DATA_CONSISTENCY,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.DATA_CONSISTENCY],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '关联活动不存在',
        field: 'activityId'
      })
      return { eligible: false, passed: false, hasBlocker: true, hasError: false, results, fieldErrors }
    }
    if (!participation) {
      results.push({
        dimension: RewardCheckDimension.DATA_CONSISTENCY,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.DATA_CONSISTENCY],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '参与记录不存在',
        field: 'participationId'
      })
      return { eligible: false, passed: false, hasBlocker: true, hasError: false, results, fieldErrors }
    }
    if (Number(participation.activityId) !== activityId) {
      results.push({
        dimension: RewardCheckDimension.DATA_CONSISTENCY,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.DATA_CONSISTENCY],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '参与记录与活动不匹配',
        field: 'participationId'
      })
      return { eligible: false, passed: false, hasBlocker: true, hasError: false, results, fieldErrors }
    }

    const user = await User.findByPk(participation.userId)
    const participantSnapshot = safeJSONParse<Record<string, any>>(participation.participantSnapshot, {
      userId: participation.userId,
      username: participation.username,
      nickname: participation.nickname,
      userLevel: user?.userLevel || 0,
      activityLevel: user?.activityLevel || 0,
      riskLevel: user?.riskLevel || 0,
      riskScore: user?.riskScore || 0
    })
    const taskSnapshot = safeJSONParse<Record<string, any>>(participation.taskDetail, {})
    const rewardRules = safeJSONParse<RewardRule[]>(activity.rewardRules, [])

    // 1. 任务完成度校验
    if (participation.taskStatus !== TaskCompletionStatus.VERIFIED) {
      results.push({
        dimension: RewardCheckDimension.TASK_COMPLETION,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.TASK_COMPLETION],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `任务尚未验证通过（当前状态：${participation.taskStatus}）`,
        field: 'participation.taskStatus'
      })
      fieldErrors['taskStatus'] = '任务未完成'
      hasBlocker = true
    }

    // 2. 参与合规性校验
    if (participation.status === ParticipationStatus.INVALID || participation.status === ParticipationStatus.CANCELLED) {
      results.push({
        dimension: RewardCheckDimension.PARTICIPATION_COMPLIANCE,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.PARTICIPATION_COMPLIANCE],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `参与状态不合规（当前：${participation.status}）`,
        field: 'participation.status'
      })
      hasBlocker = true
    }
    if (participation.isAnomaly === 1) {
      results.push({
        dimension: RewardCheckDimension.PARTICIPATION_COMPLIANCE,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.PARTICIPATION_COMPLIANCE],
        level: CheckResultLevel.ERROR,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
        message: `参与存在异常标记：${participation.anomalyReason || '异常参与'}`,
        field: 'participation.isAnomaly'
      })
      hasError = true
    }

    // 3. 领取资格校验
    const allowedStatusForReward = [ParticipationStatus.PENDING_REWARD, ParticipationStatus.TASK_COMPLETED, ParticipationStatus.REWARDED]
    if (!allowedStatusForReward.includes(participation.status as number)) {
      results.push({
        dimension: RewardCheckDimension.REWARD_QUALIFICATION,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.REWARD_QUALIFICATION],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `当前参与状态不可领取奖励`,
        field: 'participation.status'
      })
      hasBlocker = true
    }
    if (user && user.status !== 1) {
      results.push({
        dimension: RewardCheckDimension.REWARD_QUALIFICATION,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.REWARD_QUALIFICATION],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '用户账号已被禁用',
        field: 'user.status'
      })
      hasBlocker = true
    }

    // 4. 重复发放校验
    const existingReward = await ActivityReward.findOne({
      where: {
        activityId,
        participationId,
        status: { [Op.in]: [RewardStatus.PENDING_ISSUE, RewardStatus.LOCKED, RewardStatus.ISSUED, RewardStatus.ARRIVED] }
      }
    } as any)
    if (existingReward) {
      results.push({
        dimension: RewardCheckDimension.DUPLICATE_ISSUE,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.DUPLICATE_ISSUE],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `该参与记录已存在有效奖励记录（单号：${existingReward.rewardNo}）`,
        field: 'participationId'
      })
      fieldErrors['duplicate'] = '已存在奖励记录'
      hasBlocker = true
    }

    // 5. 奖励额度校验
    const rewardPlan = this._resolveRewardFromRules(rewardRules, participantSnapshot, taskSnapshot, {
      factor: options.differentialFactor,
      overrides: options.rewardOverride
    })
    const planAmount = rewardPlan ? rewardPlan.finalAmount : 0
    if (planAmount <= 0) {
      results.push({
        dimension: RewardCheckDimension.REWARD_AMOUNT,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.REWARD_AMOUNT],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '奖励金额计算结果无效（≤0）',
        field: 'rewardAmount'
      })
      hasBlocker = true
    }
    if (planAmount > REWARD_ISSUE_CONSTRAINTS.MAX_SINGLE_REWARD_AMOUNT) {
      results.push({
        dimension: RewardCheckDimension.REWARD_AMOUNT,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.REWARD_AMOUNT],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `单笔奖励金额（${planAmount}）超过上限（${REWARD_ISSUE_CONSTRAINTS.MAX_SINGLE_REWARD_AMOUNT}）`,
        field: 'rewardAmount'
      })
      hasBlocker = true
    }

    // 6. 奖励数量校验
    if (rewardPlan?.rule && rewardPlan.rule.quota !== undefined && rewardPlan.rule.quota > 0) {
      const ruleIssueCount = await ActivityReward.count({
        where: {
          activityId,
          rewardName: rewardPlan.rule.name,
          status: { [Op.in]: [RewardStatus.LOCKED, RewardStatus.ISSUED, RewardStatus.ARRIVED] }
        }
      })
      if (ruleIssueCount >= rewardPlan.rule.quota) {
        results.push({
          dimension: RewardCheckDimension.REWARD_QUANTITY,
          dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.REWARD_QUANTITY],
          level: CheckResultLevel.BLOCKER,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
          message: `奖励「${rewardPlan.rule.name}」已达发放配额（${rewardPlan.rule.quota}）`,
          field: 'rewardName'
        })
        hasBlocker = true
      }
    }

    // 7. 奖励配比校验
    if (planAmount > 0 && activity.rewardRatio) {
      const ratio = planAmount / (Number(activity.rewardBudget) || 1)
      if (ratio > Number(activity.rewardRatio) * 1.5) {
        results.push({
          dimension: RewardCheckDimension.REWARD_RATIO,
          dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.REWARD_RATIO],
          level: CheckResultLevel.WARNING,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
          message: `单笔奖励占预算比例（${(ratio * 100).toFixed(2)}%）偏高，建议关注`,
          field: 'rewardAmount'
        })
        hasError = true
      }
    }

    // 8. 活动预算校验
    const budgetUsage = await this._getActivityBudgetUsage(activityId)
    if (!options.skipBudgetCheck && budgetUsage.overBudget) {
      results.push({
        dimension: RewardCheckDimension.ACTIVITY_BUDGET,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.ACTIVITY_BUDGET],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `活动预算已耗尽（总额：${budgetUsage.budget}，已锁定：${budgetUsage.lockedAmount}）`,
        field: 'activity.rewardBudget'
      })
      fieldErrors['budget'] = '预算不足'
      hasBlocker = true
    } else if (!options.skipBudgetCheck && budgetUsage.warn) {
      results.push({
        dimension: RewardCheckDimension.ACTIVITY_BUDGET,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.ACTIVITY_BUDGET],
        level: CheckResultLevel.WARNING,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
        message: `活动预算使用率已达${(budgetUsage.usageRatio * 100).toFixed(1)}%，请注意`,
        field: 'activity.rewardBudget'
      })
      hasError = true
    }
    if (!options.skipBudgetCheck && planAmount > budgetUsage.remainingBudget) {
      results.push({
        dimension: RewardCheckDimension.ACTIVITY_BUDGET,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.ACTIVITY_BUDGET],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `剩余预算（${budgetUsage.remainingBudget}）不足以发放本次奖励（${planAmount}）`,
        field: 'activity.rewardBudget'
      })
      fieldErrors['budget'] = '剩余预算不足'
      hasBlocker = true
    }

    // 9. 用户账户校验
    if (user && user.isPermanentBanned === 1) {
      results.push({
        dimension: RewardCheckDimension.USER_ACCOUNT,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.USER_ACCOUNT],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '用户账号已被永久封禁',
        field: 'user.isPermanentBanned'
      })
      hasBlocker = true
    }
    if (user && user.punishmentStatus === 0) {
      const now = new Date()
      if (user.banExpireTime && new Date(user.banExpireTime) > now) {
        results.push({
          dimension: RewardCheckDimension.USER_ACCOUNT,
          dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.USER_ACCOUNT],
          level: CheckResultLevel.ERROR,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
          message: '用户账号处于封禁期',
          field: 'user.banExpireTime'
        })
        hasError = true
      }
    }

    // 10. 差异化规则校验
    if (options.differentialFactor && rewardPlan) {
      if (rewardPlan.factorValue < 0.1 || rewardPlan.factorValue > 10) {
        results.push({
          dimension: RewardCheckDimension.DIFFERENTIAL_RULE,
          dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.DIFFERENTIAL_RULE],
          level: CheckResultLevel.ERROR,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
          message: `差异化系数异常（${rewardPlan.factorValue}），已限制为默认值1`,
          field: 'differentialValue'
        })
        hasError = true
        rewardPlan.factorValue = 1
        rewardPlan.finalAmount = Number((Number(rewardPlan.rule.rewardAmount || 0) * 1).toFixed(2))
      }
    }

    // 11. 发放及时性校验
    if (participation.taskVerifyTime) {
      const taskVerifyTime = new Date(participation.taskVerifyTime).getTime()
      const now = Date.now()
      const hoursPassed = (now - taskVerifyTime) / (1000 * 60 * 60)
      if (hoursPassed > REWARD_ISSUE_CONSTRAINTS.MIN_ISSUE_INTERVAL_HOURS * 30) {
        results.push({
          dimension: RewardCheckDimension.TIMELINESS,
          dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.TIMELINESS],
          level: CheckResultLevel.WARNING,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
          message: `任务完成已超过${Math.floor(hoursPassed / 24)}天未发放奖励，请核实`,
          field: 'participation.taskVerifyTime'
        })
        hasError = true
      }
    }

    // 12. 账目一致性校验
    if (Math.abs(budgetUsage.lockedAmount - (budgetUsage.issuedAmount)) > 0.01 && budgetUsage.lockedAmount > 0) {
      results.push({
        dimension: RewardCheckDimension.DATA_CONSISTENCY,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.DATA_CONSISTENCY],
        level: CheckResultLevel.WARNING,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
        message: '账目存在轻微差异（锁定金额与已发放金额不匹配），建议对账',
        field: 'budget'
      })
      hasError = true
    }

    // 13. 虚假发放检测
    if (!taskSnapshot || Object.keys(taskSnapshot).length === 0) {
      results.push({
        dimension: RewardCheckDimension.FAKE_ISSUE,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.FAKE_ISSUE],
        level: CheckResultLevel.ERROR,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
        message: '任务完成证据为空，疑似虚假发放',
        field: 'taskSnapshot'
      })
      hasError = true
    }
    if (participation.violationType) {
      results.push({
        dimension: RewardCheckDimension.FAKE_ISSUE,
        dimensionName: REWARD_CHECK_DIMENSION_NAMES[RewardCheckDimension.FAKE_ISSUE],
        level: CheckResultLevel.ERROR,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
        message: `参与记录存在违规标记：${participation.violationType}`,
        field: 'participation.violationType'
      })
      hasError = true
    }

    const passed = !hasBlocker && !hasError
    const eligible = !hasBlocker

    const activitySnapshot = {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      status: activity.status,
      rewardBudget: Number(activity.rewardBudget) || 0,
      rewardRatio: Number(activity.rewardRatio) || 0,
      rewardRules: rewardRules
    }

    return {
      eligible,
      passed,
      hasBlocker,
      hasError,
      results,
      fieldErrors,
      rewardPlan: rewardPlan || undefined,
      activitySnapshot,
      participantSnapshot,
      taskSnapshot,
      budgetUsage
    }
  }

  // ==================== 创建 PENDING_ISSUE 待发放记录 ====================
  async createPending(
    activityId: number,
    participationId: number,
    operator?: OperatorInfo,
    options: { rewardOverride?: Partial<RewardRule>; differentialFactor?: RewardDifferentialFactor; remark?: string } = {}
  ) {
    const validation = await this.validateRewardIssue(activityId, participationId, operator, {
      rewardOverride: options.rewardOverride,
      differentialFactor: options.differentialFactor
    })
    const blocker = validation.results.find(r => r.level === CheckResultLevel.BLOCKER)
    if (!validation.eligible && blocker) {
      await this._writeAudit({
        rewardId: 0,
        rewardNo: '',
        activityId,
        activityName: validation.activitySnapshot?.name || '',
        userId: validation.participantSnapshot?.userId || 0,
        username: validation.participantSnapshot?.username || '',
        action: RewardAuditAction.ISSUE_BLOCKED,
        operator,
        checkDimension: blocker.dimension,
        checkLevel: blocker.level,
        checkMessage: blocker.message,
        remark: '创建待发放记录被拦截'
      })
      const err: any = new AppError(`奖励校验不通过：${blocker.message}`, 422)
      err.dimension = blocker.dimension
      err.fieldErrors = validation.fieldErrors
      err.validation = validation
      throw err
    }

    const activity = validation.activitySnapshot!
    const participant = validation.participantSnapshot!
    const rewardPlan = validation.rewardPlan!
    const rewardNo = genRewardNo()

    const t = await sequelize.transaction()
    try {
      const now = new Date()
      const expireTime = new Date(Date.now() + REWARD_ISSUE_CONSTRAINTS.DEFAULT_REWARD_EXPIRE_DAYS * 24 * 60 * 60 * 1000)
      const firstError = validation.results.find(r => r.level === CheckResultLevel.ERROR || r.level === CheckResultLevel.WARNING)

      const rec = await ActivityReward.create({
        rewardNo,
        activityId,
        activityName: activity.name,
        participationId,
        userId: participant.userId,
        username: participant.username,
        nickname: participant.nickname,
        rewardType: rewardPlan.rule.rewardType,
        rewardTypeName: REWARD_TYPE_NAMES[rewardPlan.rule.rewardType] || rewardPlan.rule.rewardType,
        rewardName: rewardPlan.rule.name,
        rewardAmount: rewardPlan.finalAmount,
        rewardQuantity: 1,
        differentialFactor: rewardPlan.factor || '',
        differentialValue: rewardPlan.factorValue,
        status: validation.hasError ? RewardStatus.PENDING_ISSUE : RewardStatus.PENDING_ISSUE,
        participantSnapshot: JSON.stringify(participant),
        taskSnapshot: JSON.stringify(validation.taskSnapshot || {}),
        rewardRulesSnapshot: JSON.stringify(activity.rewardRules || []),
        checkDimension: validation.hasError ? firstError?.dimension || '' : '',
        checkLevel: validation.hasError ? (firstError?.level || CheckResultLevel.WARNING) : CheckResultLevel.PASS,
        checkMessage: validation.hasError ? firstError?.message || '' : '',
        violationType: '',
        reconcileStatus: RewardReconcileStatus.PENDING,
        expireTime,
        remark: options.remark || '',
        operatorId: operator?.userId,
        operatorName: operator?.username,
        batchId: '',
        createTime: now,
        updateTime: now
      } as any, { transaction: t } as any) as unknown as ActivityReward

      await t.commit()

      await this._writeAudit({
        rewardId: rec.id,
        rewardNo: rec.rewardNo,
        activityId,
        activityName: activity.name,
        userId: participant.userId,
        username: participant.username,
        action: RewardAuditAction.PENDING_CREATED,
        operator,
        newData: rewardSnapshot(rec),
        changedFields: ['status', 'rewardNo', 'rewardAmount'],
        remark: options.remark || `创建待发放记录，金额：${rewardPlan.finalAmount}`
      })

      return {
        id: rec.id,
        rewardNo: rec.rewardNo,
        status: rec.status,
        statusName: REWARD_STATUS_NAMES[rec.status],
        rewardAmount: Number(rec.rewardAmount),
        validation: {
          eligible: validation.eligible,
          passed: validation.passed,
          hasBlocker: validation.hasBlocker,
          hasError: validation.hasError,
          results: validation.results,
          fieldErrors: validation.fieldErrors
        }
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  }

  // ==================== 预算锁定 ====================
  async lockBudget(rewardId: number, operator: OperatorInfo) {
    const reward = await ActivityReward.findByPk(rewardId)
    if (!reward) throw new AppError('奖励记录不存在', 404)

    if (reward.status !== RewardStatus.PENDING_ISSUE) {
      throw new AppError(`仅待发放状态可锁定预算（当前：${REWARD_STATUS_NAMES[reward.status]}）`, 400)
    }

    const oldSnap = rewardSnapshot(reward)
    const budgetUsage = await this._getActivityBudgetUsage(reward.activityId)
    const rewardAmount = Number(reward.rewardAmount) || 0

    if (rewardAmount > budgetUsage.remainingBudget) {
      await this._writeAudit({
        rewardId: reward.id,
        rewardNo: reward.rewardNo,
        activityId: reward.activityId,
        activityName: reward.activityName,
        userId: reward.userId,
        username: reward.username,
        action: RewardAuditAction.BUDGET_CHECK_FAILED,
        operator,
        oldData: oldSnap,
        checkDimension: RewardCheckDimension.ACTIVITY_BUDGET,
        checkLevel: CheckResultLevel.BLOCKER,
        checkMessage: `预算不足：需要${rewardAmount}，剩余${budgetUsage.remainingBudget}`,
        remark: '预算锁定失败'
      })
      throw new AppError(`预算不足（需要${rewardAmount}，剩余${budgetUsage.remainingBudget}）`, 400)
    }

    const t = await sequelize.transaction()
    try {
      const now = new Date()
      await reward.update({
        status: RewardStatus.LOCKED,
        budgetLockedTime: now,
        operatorId: operator.userId,
        operatorName: operator.username,
        updateTime: now
      } as any, { transaction: t })

      await Activity.increment('rewardCost', { by: rewardAmount, where: { id: reward.activityId }, transaction: t })

      await t.commit()

      const newSnap = rewardSnapshot(reward)
      const changed = computeChangedFields(oldSnap, newSnap)

      await this._writeAudit({
        rewardId: reward.id,
        rewardNo: reward.rewardNo,
        activityId: reward.activityId,
        activityName: reward.activityName,
        userId: reward.userId,
        username: reward.username,
        action: RewardAuditAction.BUDGET_LOCKED,
        operator,
        oldData: oldSnap,
        newData: newSnap,
        changedFields: changed,
        remark: `锁定预算：${rewardAmount}`
      })

      return {
        id: reward.id,
        rewardNo: reward.rewardNo,
        status: reward.status,
        statusName: REWARD_STATUS_NAMES[reward.status],
        budgetLockedTime: reward.budgetLockedTime,
        changedFields: changed
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  }

  // ==================== 功能点2：执行发放 ====================
  async issueReward(
    rewardId: number,
    operator: OperatorInfo,
    options: { accountChannel?: string; accountTargetId?: string; transactionId?: string; remark?: string; skipBudgetLock?: boolean } = {}
  ) {
    const reward = await ActivityReward.findByPk(rewardId)
    if (!reward) throw new AppError('奖励记录不存在', 404)

    const allowedStatus = [RewardStatus.PENDING_ISSUE, RewardStatus.LOCKED]
    if (!allowedStatus.includes(reward.status as number)) {
      throw new AppError(`仅待发放/锁定中状态可执行发放（当前：${REWARD_STATUS_NAMES[reward.status]}）`, 400)
    }

    const oldSnap = rewardSnapshot(reward)
    const rewardAmount = Number(reward.rewardAmount) || 0

    const t = await sequelize.transaction()
    try {
      const now = new Date()
      let currentReward = reward

      if (reward.status === RewardStatus.PENDING_ISSUE && !options.skipBudgetLock) {
        const budgetUsage = await this._getActivityBudgetUsage(reward.activityId)
        if (rewardAmount > budgetUsage.remainingBudget) {
          await t.rollback()
          await this._writeAudit({
            rewardId: reward.id,
            rewardNo: reward.rewardNo,
            activityId: reward.activityId,
            activityName: reward.activityName,
            userId: reward.userId,
            username: reward.username,
            action: RewardAuditAction.BUDGET_CHECK_FAILED,
            operator,
            oldData: oldSnap,
            checkDimension: RewardCheckDimension.ACTIVITY_BUDGET,
            checkLevel: CheckResultLevel.BLOCKER,
            checkMessage: `预算不足：需要${rewardAmount}，剩余${budgetUsage.remainingBudget}`,
            remark: '发放前预算校验失败'
          })
          throw new AppError(`预算不足（需要${rewardAmount}，剩余${budgetUsage.remainingBudget}）`, 400)
        }
        await currentReward.update({
          status: RewardStatus.LOCKED,
          budgetLockedTime: now,
          updateTime: now
        } as any, { transaction: t })
        await Activity.increment('rewardCost', { by: rewardAmount, where: { id: reward.activityId }, transaction: t })
      }

      let issueSuccess = true
      let failReason = ''
      try {
        if (!options.transactionId) {
          const mockTxId = `TX_${now.getTime()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`
          options.transactionId = mockTxId
        }
      } catch (e: any) {
        issueSuccess = false
        failReason = e.message || '发放接口调用失败'
      }

      if (!issueSuccess) {
        await currentReward.update({
          status: RewardStatus.FAILED,
          failTime: now,
          failReason,
          operatorId: operator.userId,
          operatorName: operator.username,
          updateTime: now
        } as any, { transaction: t })

        await Activity.decrement('rewardCost', { by: rewardAmount, where: { id: reward.activityId }, transaction: t })

        await t.commit()

        const newSnap = rewardSnapshot(currentReward)
        const changed = computeChangedFields(oldSnap, newSnap)

        await this._writeAudit({
          rewardId: currentReward.id,
          rewardNo: currentReward.rewardNo,
          activityId: currentReward.activityId,
          activityName: currentReward.activityName,
          userId: currentReward.userId,
          username: currentReward.username,
          action: RewardAuditAction.ISSUE_FAILED,
          operator,
          oldData: oldSnap,
          newData: newSnap,
          changedFields: changed,
          checkDimension: RewardCheckDimension.DATA_CONSISTENCY,
          checkLevel: CheckResultLevel.ERROR,
          checkMessage: failReason,
          remark: `发放失败：${failReason}`
        })

        return {
          id: currentReward.id,
          rewardNo: currentReward.rewardNo,
          status: currentReward.status,
          statusName: REWARD_STATUS_NAMES[currentReward.status],
          failReason,
          failed: true
        }
      }

      await currentReward.update({
        status: RewardStatus.ISSUED,
        issueTime: now,
        accountChannel: options.accountChannel || 'wallet',
        accountTargetId: options.accountTargetId || '',
        transactionId: options.transactionId || '',
        operatorId: operator.userId,
        operatorName: operator.username,
        updateTime: now
      } as any, { transaction: t })

      await ActivityParticipation.update(
        { status: ParticipationStatus.REWARDED, rewardStatus: 1, rewardGrantTime: now } as any,
        { where: { id: reward.participationId }, transaction: t } as any
      )

      await t.commit()

      const newSnap = rewardSnapshot(currentReward)
      const changed = computeChangedFields(oldSnap, newSnap)

      await this._writeAudit({
        rewardId: currentReward.id,
        rewardNo: currentReward.rewardNo,
        activityId: currentReward.activityId,
        activityName: currentReward.activityName,
        userId: currentReward.userId,
        username: currentReward.username,
        action: RewardAuditAction.ISSUED,
        operator,
        oldData: oldSnap,
        newData: newSnap,
        changedFields: changed,
        remark: options.remark || `发放成功，金额：${rewardAmount}`
      })

      return {
        id: currentReward.id,
        rewardNo: currentReward.rewardNo,
        status: currentReward.status,
        statusName: REWARD_STATUS_NAMES[currentReward.status],
        issueTime: currentReward.issueTime,
        accountChannel: currentReward.accountChannel,
        transactionId: currentReward.transactionId,
        changedFields: changed,
        failed: false
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  }

  // ==================== 到账确认 ====================
  async confirmArrival(
    rewardId: number,
    operator: OperatorInfo,
    options: { transactionId?: string; remark?: string } = {}
  ) {
    const reward = await ActivityReward.findByPk(rewardId)
    if (!reward) throw new AppError('奖励记录不存在', 404)

    if (reward.status !== RewardStatus.ISSUED) {
      throw new AppError(`仅已发放状态可确认到账（当前：${REWARD_STATUS_NAMES[reward.status]}）`, 400)
    }

    const oldSnap = rewardSnapshot(reward)
    const rewardAmount = Number(reward.rewardAmount) || 0

    const t = await sequelize.transaction()
    try {
      const now = new Date()
      await reward.update({
        status: RewardStatus.ARRIVED,
        arriveTime: now,
        reconcileStatus: RewardReconcileStatus.MATCHED,
        reconcileTime: now,
        reconcileRemark: '自动对账匹配',
        transactionId: options.transactionId || reward.transactionId,
        operatorId: operator.userId,
        operatorName: operator.username,
        updateTime: now
      } as any, { transaction: t })

      await Activity.increment('rewardCost', { by: 0, where: { id: reward.activityId }, transaction: t })

      await UserAccountLog.create({
        userId: reward.userId,
        userName: reward.username,
        operatorId: operator.userId,
        operatorName: operator.username,
        logType: 'activity_reward_arrive',
        fieldName: 'reward',
        oldValue: '0',
        newValue: String(rewardAmount),
        reason: `活动奖励到账：${reward.activityName}（${reward.rewardNo}）`,
        ip: operator.ip || '',
        userAgent: operator.userAgent || '',
        status: 1,
        errorMsg: '',
        createTime: now,
        updateTime: now
      } as any, { transaction: t } as any)

      await t.commit()

      const newSnap = rewardSnapshot(reward)
      const changed = computeChangedFields(oldSnap, newSnap)

      await this._writeAudit({
        rewardId: reward.id,
        rewardNo: reward.rewardNo,
        activityId: reward.activityId,
        activityName: reward.activityName,
        userId: reward.userId,
        username: reward.username,
        action: RewardAuditAction.ARRIVED_CONFIRMED,
        operator,
        oldData: oldSnap,
        newData: newSnap,
        changedFields: changed,
        remark: options.remark || `确认到账：${rewardAmount}`
      })

      return {
        id: reward.id,
        rewardNo: reward.rewardNo,
        status: reward.status,
        statusName: REWARD_STATUS_NAMES[reward.status],
        arriveTime: reward.arriveTime,
        changedFields: changed
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  }

  // ==================== 补发奖励 ====================
  async reissueReward(rewardId: number, operator: OperatorInfo) {
    const reward = await ActivityReward.findByPk(rewardId)
    if (!reward) throw new AppError('奖励记录不存在', 404)

    const allowedStatus = [RewardStatus.FAILED, RewardStatus.ROLLBACKED]
    if (!allowedStatus.includes(reward.status as number)) {
      throw new AppError(`仅发放失败/额度退回状态可补发（当前：${REWARD_STATUS_NAMES[reward.status]}）`, 400)
    }

    const oldSnap = rewardSnapshot(reward)

    const t = await sequelize.transaction()
    try {
      const now = new Date()
      await reward.update({
        status: RewardStatus.REVOKED,
        operatorId: operator.userId,
        operatorName: operator.username,
        updateTime: now
      } as any, { transaction: t })

      const newRewardNo = genRewardNo()
      const newRec = await ActivityReward.create({
        rewardNo: newRewardNo,
        activityId: reward.activityId,
        activityName: reward.activityName,
        participationId: reward.participationId,
        userId: reward.userId,
        username: reward.username,
        nickname: reward.nickname,
        rewardType: reward.rewardType,
        rewardTypeName: reward.rewardTypeName,
        rewardName: reward.rewardName,
        rewardAmount: Number(reward.rewardAmount) || 0,
        rewardQuantity: reward.rewardQuantity,
        differentialFactor: reward.differentialFactor,
        differentialValue: Number(reward.differentialValue) || 0,
        status: RewardStatus.PENDING_ISSUE,
        participantSnapshot: reward.participantSnapshot,
        taskSnapshot: reward.taskSnapshot,
        rewardRulesSnapshot: reward.rewardRulesSnapshot,
        checkDimension: '',
        checkLevel: '',
        checkMessage: '',
        violationType: '',
        reconcileStatus: RewardReconcileStatus.PENDING,
        remark: `补发自原单号：${reward.rewardNo}`,
        operatorId: operator.userId,
        operatorName: operator.username,
        batchId: reward.batchId,
        createTime: now,
        updateTime: now
      } as any, { transaction: t } as any) as unknown as ActivityReward

      await t.commit()

      const revokedSnap = rewardSnapshot(reward)
      const revokedChanged = computeChangedFields(oldSnap, revokedSnap)

      await this._writeAudit({
        rewardId: reward.id,
        rewardNo: reward.rewardNo,
        activityId: reward.activityId,
        activityName: reward.activityName,
        userId: reward.userId,
        username: reward.username,
        action: RewardAuditAction.REVOKED,
        operator,
        oldData: oldSnap,
        newData: revokedSnap,
        changedFields: revokedChanged,
        remark: `原记录撤销，补发新单号：${newRewardNo}`
      })

      await this._writeAudit({
        rewardId: newRec.id,
        rewardNo: newRec.rewardNo,
        activityId: newRec.activityId,
        activityName: newRec.activityName,
        userId: newRec.userId,
        username: newRec.username,
        action: RewardAuditAction.REISSUED,
        operator,
        newData: rewardSnapshot(newRec),
        changedFields: ['status', 'rewardNo'],
        remark: `补发成功，原单号：${reward.rewardNo}`
      })

      return {
        id: newRec.id,
        rewardNo: newRec.rewardNo,
        originalRewardId: reward.id,
        originalRewardNo: reward.rewardNo,
        status: newRec.status,
        statusName: REWARD_STATUS_NAMES[newRec.status]
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  }

  // ==================== 功能点2：回收奖励 ====================
  async recycleReward(
    rewardId: number,
    operator: OperatorInfo,
    options: { violationType?: string; violationDetail?: Record<string, any>; remark?: string } = {}
  ) {
    const reward = await ActivityReward.findByPk(rewardId)
    if (!reward) throw new AppError('奖励记录不存在', 404)

    const allowedStatus = [RewardStatus.ISSUED, RewardStatus.ARRIVED]
    if (!allowedStatus.includes(reward.status as number)) {
      await this._writeAudit({
        rewardId: reward.id,
        rewardNo: reward.rewardNo,
        activityId: reward.activityId,
        activityName: reward.activityName,
        userId: reward.userId,
        username: reward.username,
        action: RewardAuditAction.RECYCLE_BLOCKED,
        operator,
        checkDimension: RewardCheckDimension.DATA_CONSISTENCY,
        checkLevel: CheckResultLevel.BLOCKER,
        checkMessage: `仅已发放/已到账状态可回收（当前：${REWARD_STATUS_NAMES[reward.status]}）`,
        remark: '回收被拦截'
      })
      throw new AppError(`仅已发放/已到账状态可回收（当前：${REWARD_STATUS_NAMES[reward.status]}）`, 400)
    }

    const oldSnap = rewardSnapshot(reward)
    const rewardAmount = Number(reward.rewardAmount) || 0

    const t = await sequelize.transaction()
    try {
      const now = new Date()
      await reward.update({
        status: RewardStatus.RECYCLED,
        recycleTime: now,
        violationType: options.violationType || reward.violationType,
        violationDetail: options.violationDetail ? JSON.stringify(options.violationDetail) : reward.violationDetail,
        reconcileStatus: RewardReconcileStatus.PENDING,
        operatorId: operator.userId,
        operatorName: operator.username,
        updateTime: now
      } as any, { transaction: t })

      await Activity.decrement('rewardCost', { by: rewardAmount, where: { id: reward.activityId }, transaction: t })

      await UserAccountLog.create({
        userId: reward.userId,
        userName: reward.username,
        operatorId: operator.userId,
        operatorName: operator.username,
        logType: 'activity_reward_recycle',
        fieldName: 'reward',
        oldValue: String(rewardAmount),
        newValue: '0',
        reason: `活动奖励回收：${reward.activityName}（${reward.rewardNo}）${options.remark ? ' - ' + options.remark : ''}`,
        ip: operator.ip || '',
        userAgent: operator.userAgent || '',
        status: 1,
        errorMsg: '',
        createTime: now,
        updateTime: now
      } as any, { transaction: t } as any)

      await t.commit()

      const newSnap = rewardSnapshot(reward)
      const changed = computeChangedFields(oldSnap, newSnap)

      await this._writeAudit({
        rewardId: reward.id,
        rewardNo: reward.rewardNo,
        activityId: reward.activityId,
        activityName: reward.activityName,
        userId: reward.userId,
        username: reward.username,
        action: RewardAuditAction.RECYCLED,
        operator,
        oldData: oldSnap,
        newData: newSnap,
        changedFields: changed,
        violationType: options.violationType,
        violationDetail: options.violationDetail,
        remark: options.remark || `回收奖励：${rewardAmount}`
      })

      return {
        id: reward.id,
        rewardNo: reward.rewardNo,
        status: reward.status,
        statusName: REWARD_STATUS_NAMES[reward.status],
        recycleTime: reward.recycleTime,
        recycledAmount: rewardAmount,
        changedFields: changed
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  }

  // ==================== 功能点3：批量发放 ====================
  async batchIssue(
    participationIds: number[],
    operator: OperatorInfo,
    options: { accountChannel?: string; remark?: string } = {}
  ) {
    const batchId = genBatchId()
    const results: Array<{
      participationId: number
      rewardId?: number
      rewardNo?: string
      success: boolean
      message?: string
      status?: number
    }> = []

    for (const pid of participationIds) {
      try {
        let reward: ActivityReward | null = await ActivityReward.findOne({
          where: { participationId: pid, status: RewardStatus.PENDING_ISSUE }
        } as any)

        if (!reward) {
          const created = await this.createPending(0, pid, operator, { remark: options.remark })
          reward = (await ActivityReward.findByPk(created.id)) as ActivityReward | null
        }

        if (!reward) {
          results.push({ participationId: pid, success: false, message: '无法创建或找到待发放记录' })
          continue
        }

        await ActivityReward.update({ batchId } as any, { where: { id: reward.id } })

        const issueResult = await this.issueReward(reward.id, operator, {
          accountChannel: options.accountChannel,
          remark: options.remark ? `${options.remark} (批量发放)` : `批量发放 ${batchId}`
        })

        await this._writeAudit({
          rewardId: reward.id,
          rewardNo: reward.rewardNo,
          activityId: reward.activityId,
          activityName: reward.activityName,
          userId: reward.userId,
          username: reward.username,
          action: RewardAuditAction.BATCH_ISSUED,
          operator,
          batchId,
          remark: `批量发放 #${results.length + 1}/${participationIds.length}`
        })

        results.push({
          participationId: pid,
          rewardId: reward.id,
          rewardNo: reward.rewardNo,
          success: true,
          status: issueResult.status
        })
      } catch (e: any) {
        results.push({ participationId: pid, success: false, message: e.message || '发放失败' })
      }
    }

    return {
      batchId,
      total: participationIds.length,
      successCount: results.filter(r => r.success).length,
      failCount: results.filter(r => !r.success).length,
      results
    }
  }

  // ==================== 功能点3：批量补发 ====================
  async batchReissue(rewardIds: number[], operator: OperatorInfo) {
    const batchId = genBatchId()
    const results: Array<{
      originalRewardId: number
      originalRewardNo?: string
      newRewardId?: number
      newRewardNo?: string
      success: boolean
      message?: string
    }> = []

    for (const rid of rewardIds) {
      try {
        const original = await ActivityReward.findByPk(rid)
        const reissued = await this.reissueReward(rid, operator)

        await ActivityReward.update({ batchId } as any, { where: { id: reissued.id } })

        await this._writeAudit({
          rewardId: reissued.id,
          rewardNo: reissued.rewardNo,
          activityId: original?.activityId || 0,
          activityName: original?.activityName || '',
          userId: original?.userId || 0,
          username: original?.username || '',
          action: RewardAuditAction.BATCH_REISSUED,
          operator,
          batchId,
          remark: `批量补发 #${results.length + 1}/${rewardIds.length}`
        })

        results.push({
          originalRewardId: rid,
          originalRewardNo: original?.rewardNo,
          newRewardId: reissued.id,
          newRewardNo: reissued.rewardNo,
          success: true
        })
      } catch (e: any) {
        results.push({ originalRewardId: rid, success: false, message: e.message || '补发失败' })
      }
    }

    return {
      batchId,
      total: rewardIds.length,
      successCount: results.filter(r => r.success).length,
      failCount: results.filter(r => !r.success).length,
      results
    }
  }

  // ==================== 功能点3：批量回收 ====================
  async batchRecycle(
    rewardIds: number[],
    operator: OperatorInfo,
    options: { violationType?: string; remark?: string } = {}
  ) {
    const batchId = genBatchId()
    const results: Array<{
      rewardId: number
      rewardNo?: string
      success: boolean
      message?: string
      recycledAmount?: number
    }> = []

    for (const rid of rewardIds) {
      try {
        const reward = await ActivityReward.findByPk(rid)
        const recycled = await this.recycleReward(rid, operator, {
          violationType: options.violationType,
          remark: options.remark ? `${options.remark} (批量回收)` : `批量回收 ${batchId}`
        })

        await this._writeAudit({
          rewardId: rid,
          rewardNo: reward?.rewardNo || '',
          activityId: reward?.activityId || 0,
          activityName: reward?.activityName || '',
          userId: reward?.userId || 0,
          username: reward?.username || '',
          action: RewardAuditAction.BATCH_RECYCLED,
          operator,
          batchId,
          violationType: options.violationType,
          remark: `批量回收 #${results.length + 1}/${rewardIds.length}`
        })

        results.push({
          rewardId: rid,
          rewardNo: reward?.rewardNo,
          success: true,
          recycledAmount: recycled.recycledAmount
        })
      } catch (e: any) {
        results.push({ rewardId: rid, success: false, message: e.message || '回收失败' })
      }
    }

    return {
      batchId,
      total: rewardIds.length,
      successCount: results.filter(r => r.success).length,
      failCount: results.filter(r => !r.success).length,
      results
    }
  }

  // ==================== 功能点3：差异化批量发放 ====================
  async batchIssueDifferential(
    items: Array<{
      participationId: number
      rewardOverride?: Partial<RewardRule>
      remark?: string
    }>,
    operator: OperatorInfo,
    factor?: RewardDifferentialFactor
  ) {
    const batchId = genBatchId()
    const results: Array<{
      participationId: number
      rewardId?: number
      rewardNo?: string
      finalAmount?: number
      factor?: string
      factorValue?: number
      success: boolean
      message?: string
    }> = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        const validation = await this.validateRewardIssue(0, item.participationId, operator, {
          rewardOverride: item.rewardOverride,
          differentialFactor: factor
        })
        const blocker = validation.results.find(r => r.level === CheckResultLevel.BLOCKER)
        if (!validation.eligible && blocker) {
          results.push({
            participationId: item.participationId,
            success: false,
            message: blocker.message
          })
          continue
        }

        const created = await this.createPending(
          validation.activitySnapshot?.id || 0,
          item.participationId,
          operator,
          {
            rewardOverride: item.rewardOverride,
            differentialFactor: factor,
            remark: item.remark
          }
        )

        await ActivityReward.update({ batchId } as any, { where: { id: created.id } })

        await this.issueReward(created.id, operator, {
          remark: item.remark ? `${item.remark} (差异化批量发放)` : `差异化批量发放 ${batchId}`
        })

        await this._writeAudit({
          rewardId: created.id,
          rewardNo: created.rewardNo,
          activityId: validation.activitySnapshot?.id || 0,
          activityName: validation.activitySnapshot?.name || '',
          userId: validation.participantSnapshot?.userId || 0,
          username: validation.participantSnapshot?.username || '',
          action: RewardAuditAction.BATCH_ISSUED,
          operator,
          batchId,
          remark: `差异化批量发放 #${i + 1}/${items.length}，因子：${factor || '无'}`
        })

        results.push({
          participationId: item.participationId,
          rewardId: created.id,
          rewardNo: created.rewardNo,
          finalAmount: created.rewardAmount,
          factor: validation.rewardPlan?.factor,
          factorValue: validation.rewardPlan?.factorValue,
          success: true
        })
      } catch (e: any) {
        results.push({
          participationId: item.participationId,
          success: false,
          message: e.message || '差异化发放失败'
        })
      }
    }

    return {
      batchId,
      factor: factor || '',
      factorName: factor ? REWARD_DIFFERENTIAL_FACTOR_NAMES[factor] : '',
      total: items.length,
      successCount: results.filter(r => r.success).length,
      failCount: results.filter(r => !r.success).length,
      results
    }
  }

  // ==================== 奖励记录分页列表 ====================
  async list(params: {
    activityId?: number
    userId?: number
    status?: number | number[]
    violationType?: string
    reconcileStatus?: number
    keyword?: string
    page?: number
    pageSize?: number
  }) {
    const where: any = {}
    if (params.activityId) where.activityId = params.activityId
    if (params.userId) where.userId = params.userId
    if (params.status !== undefined) {
      where.status = Array.isArray(params.status) ? { [Op.in]: params.status } : params.status
    }
    if (params.violationType) where.violationType = params.violationType
    if (params.reconcileStatus !== undefined) where.reconcileStatus = params.reconcileStatus
    if (params.keyword) {
      where[Op.or] = [
        { rewardNo: { [Op.like]: `%${params.keyword}%` } },
        { username: { [Op.like]: `%${params.keyword}%` } },
        { nickname: { [Op.like]: `%${params.keyword}%` } },
        { activityName: { [Op.like]: `%${params.keyword}%` } },
        { rewardName: { [Op.like]: `%${params.keyword}%` } }
      ]
    }

    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(200, params.pageSize || 20)
    const { count, rows } = await ActivityReward.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })

    return {
      total: count,
      page,
      pageSize,
      list: rows.map(decorateReward)
    }
  }

  // ==================== 奖励详情 ====================
  async detail(id: number) {
    const rec = await ActivityReward.findByPk(id)
    if (!rec) throw new AppError('奖励记录不存在', 404)
    return decorateReward(rec)
  }

  // ==================== 功能点4：审计日志列表 ====================
  async getAuditLogs(params: {
    rewardId?: number
    userId?: number
    activityId?: number
    action?: string
    batchId?: string
    page?: number
    pageSize?: number
  }) {
    const where: any = {}
    if (params.rewardId) where.rewardId = params.rewardId
    if (params.userId) where.userId = params.userId
    if (params.activityId) where.activityId = params.activityId
    if (params.action) where.action = params.action
    if (params.batchId) where.batchId = params.batchId

    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(200, params.pageSize || 20)
    const { count, rows } = await ActivityRewardAuditLog.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })

    const list = rows.map(r => {
      const data = (r as any).toJSON ? (r as any).toJSON() : { ...r }
      data.oldData = safeJSONParse(data.oldData, null)
      data.newData = safeJSONParse(data.newData, null)
      data.changedFields = safeJSONParse<string[]>(data.changedFields, [])
      data.violationDetail = safeJSONParse(data.violationDetail, null)
      data.oldAmount = Number(data.oldAmount) || 0
      data.newAmount = Number(data.newAmount) || 0
      return data
    })

    return { total: count, page, pageSize, list }
  }

  // ==================== 功能点4：指定奖励溯源 + 版本diff ====================
  async getRewardTraceSnapshot(rewardId: number, auditLogId?: number) {
    const reward = await ActivityReward.findByPk(rewardId)
    if (!reward) throw new AppError('奖励记录不存在', 404)

    const auditLogs = await ActivityRewardAuditLog.findAll({
      where: { rewardId },
      order: [['createTime', 'ASC']]
    })

    const current = decorateReward(reward)
    let history: any = null
    let diff: Array<{ field: string; oldValue: any; newValue: any }> = []

    if (auditLogId) {
      const target = auditLogs.find(l => l.id === auditLogId)
      if (!target) throw new AppError('指定的溯源记录不存在', 404)
      history = {
        ...target,
        oldData: safeJSONParse((target as any).oldData, null),
        newData: safeJSONParse((target as any).newData, null),
        changedFields: safeJSONParse<string[]>((target as any).changedFields, [])
      }
      if (history.oldData && history.newData) {
        const fields = history.changedFields.length ? history.changedFields : computeChangedFields(history.oldData, history.newData)
        diff = fields.map((f: string) => ({ field: f, oldValue: history.oldData?.[f], newValue: history.newData?.[f] }))
      }
    }

    const serializedLogs = auditLogs.map(l => {
      const data = (l as any).toJSON ? (l as any).toJSON() : { ...l }
      data.oldData = safeJSONParse(data.oldData, null)
      data.newData = safeJSONParse(data.newData, null)
      data.changedFields = safeJSONParse<string[]>(data.changedFields, [])
      data.violationDetail = safeJSONParse(data.violationDetail, null)
      data.oldAmount = Number(data.oldAmount) || 0
      data.newAmount = Number(data.newAmount) || 0
      return data
    })

    return { current, history, diff, auditLogs: serializedLogs }
  }

  // ==================== 功能点4：账目一致性核对 ====================
  async reconcileAccount(activityId?: number, operator?: OperatorInfo) {
    const activityWhere: any = {}
    if (activityId) activityWhere.id = activityId

    const activities = await Activity.findAll({ where: activityWhere, attributes: ['id', 'name', 'rewardBudget'] })
    const mismatchList: Array<{
      activityId: number
      activityName: string
      budget: number
      lockedAmount: number
      issuedAmount: number
      arrivedAmount: number
      remainingBudget: number
      delta: number
      issue: string
    }> = []
    const summary: Record<string, any> = {
      totalActivities: activities.length,
      totalBudget: 0,
      totalLocked: 0,
      totalIssued: 0,
      totalArrived: 0,
      matchedCount: 0,
      mismatchCount: 0
    }

    for (const act of activities) {
      const usage = await this._getActivityBudgetUsage(act.id)
      const budget = Number(act.rewardBudget) || 0
      summary.totalBudget += budget
      summary.totalLocked += usage.lockedAmount
      summary.totalIssued += usage.issuedAmount
      summary.totalArrived += usage.arrivedAmount

      const delta = budget - usage.lockedAmount - usage.remainingBudget
      const hasMismatch = Math.abs(delta) > 0.01 || Math.abs(usage.lockedAmount - usage.issuedAmount) > 0.01

      if (hasMismatch) {
        mismatchList.push({
          activityId: act.id,
          activityName: act.name,
          budget,
          lockedAmount: usage.lockedAmount,
          issuedAmount: usage.issuedAmount,
          arrivedAmount: usage.arrivedAmount,
          remainingBudget: usage.remainingBudget,
          delta,
          issue: Math.abs(delta) > 0.01
            ? `预算差额：${delta.toFixed(2)}（预算 - 已锁定 - 剩余 ≠ 0）`
            : `锁定与发放不一致：锁定${usage.lockedAmount}，发放${usage.issuedAmount}`
        })
        summary.mismatchCount++

        await ActivityReward.update(
          { reconcileStatus: RewardReconcileStatus.MISMATCH, reconcileRemark: `账目不一致：${delta.toFixed(2)}`, reconcileTime: new Date() } as any,
          { where: { activityId: act.id, status: { [Op.in]: [RewardStatus.ISSUED, RewardStatus.ARRIVED] } } } as any
        )
      } else {
        summary.matchedCount++
        await ActivityReward.update(
          { reconcileStatus: RewardReconcileStatus.MATCHED, reconcileRemark: '自动对账通过', reconcileTime: new Date() } as any,
          { where: { activityId: act.id, status: { [Op.in]: [RewardStatus.ISSUED, RewardStatus.ARRIVED] } } } as any
        )
      }

      if (operator) {
        await this._writeAudit({
          rewardId: 0,
          rewardNo: '',
          activityId: act.id,
          activityName: act.name,
          userId: 0,
          username: '',
          action: RewardAuditAction.ACCOUNT_RECONCILED,
          operator,
          remark: hasMismatch
            ? `对账发现异常：${mismatchList[mismatchList.length - 1].issue}`
            : `对账通过，预算${budget}，锁定${usage.lockedAmount}，发放${usage.issuedAmount}`
        })
      }
    }

    const matched = mismatchList.length === 0
    return { matched, mismatchList, summary }
  }

  // ==================== 功能点4：全局对账统计 ====================
  async getReconcileStats(_operator?: OperatorInfo) {
    const allActivities = await Activity.findAll({
      attributes: ['id', 'name', 'rewardBudget', 'rewardCost'],
      where: { rewardBudget: { [Op.gt]: 0 } }
    })

    const byActivity: Record<number, any> = {}
    const byStatus: Record<number, { count: number; amount: number }> = {}

    for (const status of Object.values(RewardStatus)) {
      if (typeof status === 'number') {
        byStatus[status] = { count: 0, amount: 0 }
      }
    }

    for (const act of allActivities) {
      const usage = await this._getActivityBudgetUsage(act.id)
      const { budget: _usedBudget, ...restUsage } = usage
      byActivity[act.id] = {
        activityId: act.id,
        activityName: act.name,
        budget: Number(act.rewardBudget) || 0,
        rewardCost: Number(act.rewardCost) || 0,
        ...restUsage
      }
    }

    const statusGroups = await ActivityReward.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt'], [sequelize.fn('SUM', sequelize.col('rewardAmount')), 'sum']],
      group: ['status']
    } as any)

    for (const g of statusGroups as any[]) {
      const s = Number(g.getDataValue('status'))
      byStatus[s] = {
        count: Number(g.getDataValue('cnt')) || 0,
        amount: Number(g.getDataValue('sum')) || 0
      }
    }

    const reconcileGroups = await ActivityReward.findAll({
      attributes: ['reconcileStatus', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
      group: ['reconcileStatus']
    } as any)

    const byReconcileStatus: Record<number, number> = {}
    for (const g of reconcileGroups as any[]) {
      const s = Number(g.getDataValue('reconcileStatus'))
      byReconcileStatus[s] = Number(g.getDataValue('cnt')) || 0
    }

    const statusStats: Record<string, any> = {}
    for (const [k, v] of Object.entries(byStatus)) {
      const key = Number(k)
      statusStats[key] = {
        ...v,
        statusName: REWARD_STATUS_NAMES[key] || ''
      }
    }

    return {
      byActivity,
      byStatus: statusStats,
      byReconcileStatus: Object.fromEntries(
        Object.entries(byReconcileStatus).map(([k, v]) => [
          k,
          { count: v, statusName: REWARD_RECONCILE_STATUS_NAMES[Number(k)] || '' }
        ])
      )
    }
  }

  // ==================== 用户我的奖励列表 ====================
  async getUserRewards(
    userId: number,
    params: { status?: number | number[]; page?: number; pageSize?: number } = {}
  ) {
    const where: any = { userId }
    if (params.status !== undefined) {
      where.status = Array.isArray(params.status) ? { [Op.in]: params.status } : params.status
    }

    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(100, params.pageSize || 20)
    const { count, rows } = await ActivityReward.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })

    return {
      total: count,
      page,
      pageSize,
      list: rows.map(decorateReward)
    }
  }
}

export default new ActivityRewardService()