import {
  User,
  ActivityScoreLog,
  ActivityOperationStrategy,
  ActivityOperationRecord,
  Comment,
  Note
} from '@/models/index'
import { AppError } from '@/utils/response'
import { Op } from 'sequelize'
import {
  ActivityLevel,
  ACTIVITY_LEVEL_NAMES,
  ACTIVITY_LEVEL_COLORS,
  ACTIVITY_LEVEL_THRESHOLDS,
  ActivityScoreFactor,
  ACTIVITY_SCORE_FACTOR_WEIGHTS,
  OperationStrategyType,
  OPERATION_STRATEGY_NAMES,
  ACTIVITY_LEVEL_STRATEGY_MAP,
  OperationExecuteType,
  OperationStatus,
  ActivityAbnormalType,
  ACTIVITY_ABNORMAL_NAMES,
  ActivityLogType,
  ACTIVITY_LOG_TYPE_NAMES,
  ActivityBatchType,
  ACTIVITY_BATCH_TYPE_NAMES
} from '@/enums/business'
import sequelize from '@config/database'

interface OperatorInfo {
  userId: number
  username: string
  roles: string[]
  permissions: string[]
}

interface ActivityScoreDetail {
  dailyLogin: number
  weeklyLogin: number
  monthlyLogin: number
  publish: number
  comment: number
  like: number
  interact: number
  share: number
  total: number
}

interface ActivityListQueryParams {
  page: number
  pageSize: number
  uid?: number
  nickname?: string
  activityLevel?: number | number[]
  minScore?: number
  maxScore?: number
  isFocusMaintenance?: number
  updateStartDate?: string
  updateEndDate?: string
  status?: number
  strategies?: string[]
}

interface ScoreLogQueryParams {
  page: number
  pageSize: number
  userId?: number
  startTime?: string
  endTime?: string
  logType?: string
  isAbnormal?: number
  operatorId?: number
}

interface BatchOperationData {
  operationType: string
  userIds: number[]
  strategyIds?: number[]
  executeType: 'immediate' | 'scheduled'
  scheduledTime?: Date
  remark?: string
}

interface AbnormalWarningParams {
  page: number
  pageSize: number
  abnormalType?: string
  activityLevel?: number
  startTime?: string
  endTime?: string
}

interface FilterConditions {
  activityLevels?: number[]
  minScore?: number
  maxScore?: number
  startDate?: string
  endDate?: string
  strategies?: string[]
}

const ACTIVITY_BASELINES = {
  DAILY_LOGIN_MAX: 1,
  WEEKLY_LOGIN_MAX: 7,
  MONTHLY_LOGIN_MAX: 30,
  WEEKLY_PUBLISH_MAX: 10,
  WEEKLY_COMMENT_MAX: 30,
  WEEKLY_LIKE_MAX: 100,
  WEEKLY_INTERACT_MAX: 50,
  WEEKLY_SHARE_MAX: 10
}

const ABNORMAL_FLUCTUATION_THRESHOLD = 30
const CONSECUTIVE_ABNORMAL_THRESHOLD = 3
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export const activityOperationService = {
  async checkPermission(operator: OperatorInfo, operation: string): Promise<{ allowed: boolean; reason?: string }> {
    const permissionMap: Record<string, { roles: string[] }> = {
      view_list: { roles: ['admin', 'operation_admin', 'operator'] },
      view_detail: { roles: ['admin', 'operation_admin', 'operator'] },
      refresh_data: { roles: ['admin', 'operation_admin'] },
      manage_strategy: { roles: ['admin', 'operation_admin'] },
      batch_operation: { roles: ['admin', 'operation_admin'] },
      view_logs: { roles: ['admin', 'operation_admin', 'operator'] },
      abnormal_detect: { roles: ['admin', 'operation_admin'] }
    }

    const perm = permissionMap[operation]
    if (!perm) {
      return { allowed: false, reason: 'Invalid operation type' }
    }

    const hasRole = operator.roles.some(role => perm.roles.includes(role))
    if (!hasRole) {
      const roleNames: Record<string, string> = {
        admin: 'Administrator',
        operation_admin: 'Operation Admin',
        operator: 'Operator'
      }
      const requiredRoles = perm.roles.map(r => roleNames[r] || r).join(' or ')
      return { allowed: false, reason: `No permission for ${operation}, requires ${requiredRoles} role` }
    }

    return { allowed: true }
  },

  async getActivityList(
    params: ActivityListQueryParams,
    operator: OperatorInfo
  ): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
    permission: {
      canView: boolean
      canRefresh: boolean
      canBatch: boolean
      canManageStrategy: boolean
      canDetectAbnormal: boolean
    }
  }> {
    const permCheck = await this.checkPermission(operator, 'view_list')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const {
      page,
      pageSize,
      uid,
      nickname,
      activityLevel,
      minScore,
      maxScore,
      isFocusMaintenance,
      updateStartDate,
      updateEndDate,
      status,
      strategies
    } = params

    const where: any = {}

    if (uid !== undefined) {
      where.id = uid
    }
    if (nickname) {
      where.nickname = { [Op.like]: `%${nickname}%` }
    }
    if (activityLevel !== undefined) {
      if (Array.isArray(activityLevel)) {
        where.activityLevel = { [Op.in]: activityLevel }
      } else {
        where.activityLevel = activityLevel
      }
    }
    if (minScore !== undefined) {
      where.activityScore = { ...where.activityScore, [Op.gte]: minScore }
    }
    if (maxScore !== undefined) {
      where.activityScore = { ...where.activityScore, [Op.lte]: maxScore }
    }
    if (isFocusMaintenance !== undefined) {
      where.isFocusMaintenance = isFocusMaintenance
    }
    if (updateStartDate) {
      where.lastActivityUpdateTime = { ...where.lastActivityUpdateTime, [Op.gte]: new Date(updateStartDate) }
    }
    if (updateEndDate) {
      where.lastActivityUpdateTime = { ...where.lastActivityUpdateTime, [Op.lte]: new Date(updateEndDate) }
    }
    if (status !== undefined) {
      where.status = status
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['activityScore', 'DESC']]
    })

    const list = rows.map((row: any) => {
      const data = row.toJSON()
      if (data.activityScoreDetail) {
        try {
          data.activityScoreDetail = JSON.parse(data.activityScoreDetail)
        } catch {
          data.activityScoreDetail = {}
        }
      }
      if (data.activityStrategies) {
        try {
          data.activityStrategies = JSON.parse(data.activityStrategies)
        } catch {
          data.activityStrategies = []
        }
      }
      data.activityLevelName = ACTIVITY_LEVEL_NAMES[data.activityLevel]
      data.activityLevelColor = ACTIVITY_LEVEL_COLORS[data.activityLevel]

      if (strategies && strategies.length > 0 && data.activityStrategies) {
        const hasAllStrategies = strategies.every((s: string) => data.activityStrategies.includes(s))
        if (!hasAllStrategies) {
          return null
        }
      }

      return data
    }).filter(Boolean)

    const isAdmin = operator.roles.includes('admin')
    const isOperationAdmin = operator.roles.includes('operation_admin')

    return {
      list,
      total: count,
      page,
      pageSize,
      permission: {
        canView: true,
        canRefresh: isAdmin || isOperationAdmin,
        canBatch: isAdmin || isOperationAdmin,
        canManageStrategy: isAdmin || isOperationAdmin,
        canDetectAbnormal: isAdmin || isOperationAdmin
      }
    }
  },

  async calculateActivityScore(userId: number): Promise<{ detail: ActivityScoreDetail; totalScore: number }> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [publishCount, commentCount, shareNotes] = await Promise.all([
      Note.count({
        where: {
          authorId: userId,
          status: 2,
          publishTime: { [Op.gte]: weekAgo }
        } as any
      }),
      Comment.count({
        where: {
          userId,
          status: 1,
          createTime: { [Op.gte]: weekAgo }
        } as any
      }),
      Note.sum('shareCount', {
        where: {
          authorId: userId,
          publishTime: { [Op.gte]: weekAgo }
        } as any
      }) as Promise<number | null>
    ])

    const dailyLoginRaw = user.dailyLoginCount || 0
    const weeklyLoginRaw = user.weeklyLoginCount || 0
    const monthlyLoginRaw = user.monthlyLoginCount || 0
    const weeklyPublishRaw = Math.max(user.weeklyPublishCount || 0, publishCount)
    const weeklyCommentRaw = Math.max(user.weeklyCommentCount || 0, commentCount)
    const weeklyLikeRaw = user.weeklyLikeCount || 0
    const weeklyInteractRaw = user.weeklyInteractionCount || 0
    const weeklyShareRaw = shareNotes || 0

    const dailyLoginScore = Math.min(
      ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.DAILY_LOGIN],
      (dailyLoginRaw / ACTIVITY_BASELINES.DAILY_LOGIN_MAX) * ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.DAILY_LOGIN]
    )
    const weeklyLoginScore = Math.min(
      ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.WEEKLY_LOGIN],
      (weeklyLoginRaw / ACTIVITY_BASELINES.WEEKLY_LOGIN_MAX) * ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.WEEKLY_LOGIN]
    )
    const monthlyLoginScore = Math.min(
      ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.MONTHLY_LOGIN],
      (monthlyLoginRaw / ACTIVITY_BASELINES.MONTHLY_LOGIN_MAX) * ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.MONTHLY_LOGIN]
    )
    const publishScore = Math.min(
      ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.PUBLISH],
      (weeklyPublishRaw / ACTIVITY_BASELINES.WEEKLY_PUBLISH_MAX) * ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.PUBLISH]
    )
    const commentScore = Math.min(
      ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.COMMENT],
      (weeklyCommentRaw / ACTIVITY_BASELINES.WEEKLY_COMMENT_MAX) * ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.COMMENT]
    )
    const likeScore = Math.min(
      ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.LIKE],
      (weeklyLikeRaw / ACTIVITY_BASELINES.WEEKLY_LIKE_MAX) * ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.LIKE]
    )
    const interactScore = Math.min(
      ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.INTERACT],
      (weeklyInteractRaw / ACTIVITY_BASELINES.WEEKLY_INTERACT_MAX) * ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.INTERACT]
    )
    const shareScore = Math.min(
      ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.SHARE],
      (weeklyShareRaw / ACTIVITY_BASELINES.WEEKLY_SHARE_MAX) * ACTIVITY_SCORE_FACTOR_WEIGHTS[ActivityScoreFactor.SHARE]
    )

    const totalScore = Math.min(100, Math.max(0, Math.round(
      dailyLoginScore +
      weeklyLoginScore +
      monthlyLoginScore +
      publishScore +
      commentScore +
      likeScore +
      interactScore +
      shareScore
    )))

    const detail: ActivityScoreDetail = {
      dailyLogin: Math.round(dailyLoginScore * 100) / 100,
      weeklyLogin: Math.round(weeklyLoginScore * 100) / 100,
      monthlyLogin: Math.round(monthlyLoginScore * 100) / 100,
      publish: Math.round(publishScore * 100) / 100,
      comment: Math.round(commentScore * 100) / 100,
      like: Math.round(likeScore * 100) / 100,
      interact: Math.round(interactScore * 100) / 100,
      share: Math.round(shareScore * 100) / 100,
      total: totalScore
    }

    return { detail, totalScore }
  },

  determineLevel(score: number): number {
    const thresholds = ACTIVITY_LEVEL_THRESHOLDS

    if (score <= thresholds[ActivityLevel.SLEEPER].max) {
      return ActivityLevel.SLEEPER
    }
    if (score <= thresholds[ActivityLevel.LOW].max) {
      return ActivityLevel.LOW
    }
    if (score <= thresholds[ActivityLevel.NORMAL].max) {
      return ActivityLevel.NORMAL
    }
    return ActivityLevel.HIGH
  },

  validateFilterConditions(conditions: FilterConditions): { valid: boolean; conflicts: string[] } {
    const conflicts: string[] = []

    if (conditions.activityLevels && conditions.activityLevels.length > 0) {
      const levels = conditions.activityLevels

      if (levels.includes(ActivityLevel.HIGH) && levels.includes(ActivityLevel.SLEEPER)) {
        conflicts.push('Cannot select both HIGH and SLEEPER activity levels simultaneously')
      }

      const uniqueLevels = [...new Set(levels)]
      if (uniqueLevels.length !== levels.length) {
        conflicts.push('Duplicate activity level selections detected')
      }
    }

    if (conditions.minScore !== undefined && conditions.maxScore !== undefined) {
      if (conditions.minScore > conditions.maxScore) {
        conflicts.push('Minimum score cannot be greater than maximum score')
      }
      if (conditions.minScore < 0 || conditions.maxScore > 100) {
        conflicts.push('Score range must be within 0-100')
      }
    }

    if (conditions.startDate && conditions.endDate) {
      const start = new Date(conditions.startDate).getTime()
      const end = new Date(conditions.endDate).getTime()
      if (start > end) {
        conflicts.push('Start date cannot be later than end date')
      }
    }

    if (conditions.activityLevels && (conditions.minScore !== undefined || conditions.maxScore !== undefined)) {
      const levels = conditions.activityLevels
      for (const level of levels) {
        const threshold = ACTIVITY_LEVEL_THRESHOLDS[level]
        if (threshold) {
          if (conditions.minScore !== undefined && conditions.minScore > threshold.max) {
            conflicts.push(`Score min ${conditions.minScore} conflicts with ${ACTIVITY_LEVEL_NAMES[level]} level (max ${threshold.max})`)
          }
          if (conditions.maxScore !== undefined && conditions.maxScore < threshold.min && threshold.min >= 0) {
            conflicts.push(`Score max ${conditions.maxScore} conflicts with ${ACTIVITY_LEVEL_NAMES[level]} level (min ${threshold.min})`)
          }
        }
      }
    }

    return {
      valid: conflicts.length === 0,
      conflicts
    }
  },

  async getUserActivityDetail(userId: number, operator: OperatorInfo): Promise<any> {
    const permCheck = await this.checkPermission(operator, 'view_detail')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      throw new AppError('User not found', 404)
    }

    const { detail, totalScore } = await this.calculateActivityScore(userId)
    const currentLevel = this.determineLevel(totalScore)

    const recentLogs = await ActivityScoreLog.findAll({
      where: { userId },
      order: [['createTime', 'DESC']],
      limit: 20
    })

    const data = user.toJSON() as any
    if (data.activityScoreDetail) {
      try {
        data.activityScoreDetail = JSON.parse(data.activityScoreDetail)
      } catch {
        data.activityScoreDetail = {}
      }
    }
    if (data.activityStrategies) {
      try {
        data.activityStrategies = JSON.parse(data.activityStrategies)
      } catch {
        data.activityStrategies = []
      }
    }

    const matchedStrategies = await ActivityOperationStrategy.findAll({
      where: {
        status: 1,
        targetActivityLevel: {
          [Op.like]: `%${currentLevel}%`
        }
      } as any
    })

    return {
      user: {
        ...data,
        activityLevelName: ACTIVITY_LEVEL_NAMES[data.activityLevel ?? currentLevel],
        activityLevelColor: ACTIVITY_LEVEL_COLORS[data.activityLevel ?? currentLevel]
      },
      currentCalculation: {
        score: totalScore,
        level: currentLevel,
        levelName: ACTIVITY_LEVEL_NAMES[currentLevel],
        detail
      },
      activityStrategies: data.activityStrategies,
      matchedStrategies,
      recentLogs
    }
  },

  async applyStrategiesByLevel(
    userId: number,
    newLevel: number,
    operator: OperatorInfo
  ): Promise<{
    success: boolean
    appliedStrategies: string[]
    removedStrategies: string[]
  }> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    const strategyTypes = ACTIVITY_LEVEL_STRATEGY_MAP[newLevel] || []
    const currentStrategies = user.activityStrategies ? JSON.parse(user.activityStrategies) : []

    const matchedStrategies = await ActivityOperationStrategy.findAll({
      where: {
        status: 1,
        strategyType: { [Op.in]: strategyTypes },
        autoApply: 1
      }
    })

    const newStrategyIds = matchedStrategies.map(s => s.id)
    const oldStrategies = currentStrategies

    const appliedStrategies: string[] = []
    const removedStrategies: string[] = []

    for (const strategy of matchedStrategies) {
      if (!oldStrategies.includes(strategy.id)) {
        appliedStrategies.push(strategy.strategyType)
      }
    }

    for (const oldId of oldStrategies) {
      if (!newStrategyIds.includes(oldId)) {
        const oldStrategy = await ActivityOperationStrategy.findByPk(oldId)
        if (oldStrategy) {
          removedStrategies.push(oldStrategy.strategyType)
        }
      }
    }

    const t = await sequelize.transaction()

    try {
      await user.update({
        activityStrategies: JSON.stringify(newStrategyIds)
      }, { transaction: t })

      for (const strategy of matchedStrategies) {
        await strategy.update({
          applyCount: (strategy.applyCount || 0) + 1,
          successCount: (strategy.successCount || 0) + 1
        }, { transaction: t })
      }

      const oldScore = user.activityScore ?? 0
      const newScore = (await this.calculateActivityScore(userId)).totalScore

      await ActivityScoreLog.create({
        userId,
        userName: user.username,
        oldLevel: user.activityLevel ?? ActivityLevel.LOW,
        newLevel,
        oldScore,
        newScore,
        changeType: 'strategy_apply',
        logType: ActivityLogType.STRATEGY_APPLY,
        scoreDetail: JSON.stringify({ appliedStrategies, removedStrategies }),
        operatorId: operator.userId,
        operatorName: operator.username,
        remark: `Auto-apply strategies for level ${ACTIVITY_LEVEL_NAMES[newLevel]}`
      } as any, { transaction: t })

      await t.commit()

      return {
        success: true,
        appliedStrategies,
        removedStrategies
      }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async refreshActivityData(
    userId: number,
    operator: OperatorInfo
  ): Promise<{
    success: boolean
    oldScore: number
    newScore: number
    oldLevel: number
    newLevel: number
    levelChanged: boolean
    strategyChange: { applied: string[]; removed: string[] }
  }> {
    const permCheck = await this.checkPermission(operator, 'refresh_data')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    const oldScore = user.activityScore ?? 0
    const oldLevel = user.activityLevel ?? ActivityLevel.LOW

    const { detail, totalScore: newScore } = await this.calculateActivityScore(userId)
    const newLevel = this.determineLevel(newScore)
    const levelChanged = oldLevel !== newLevel

    const t = await sequelize.transaction()

    let strategyChangeResult: { applied: string[]; removed: string[] } = { applied: [], removed: [] }

    try {
      await user.update({
        activityScore: newScore,
        activityLevel: newLevel,
        activityScoreDetail: JSON.stringify(detail),
        lastActivityUpdateTime: new Date()
      }, { transaction: t })

      if (levelChanged) {
        const result = await this.applyStrategiesByLevel(userId, newLevel, operator)
        strategyChangeResult = { applied: result.appliedStrategies, removed: result.removedStrategies }
      }

      const fluctuationAmount = newScore - oldScore
      const isAbnormalFluctuation = Math.abs(fluctuationAmount) > ABNORMAL_FLUCTUATION_THRESHOLD

      await ActivityScoreLog.create({
        userId,
        userName: user.username,
        oldLevel,
        newLevel,
        oldScore,
        newScore,
        scoreDetail: JSON.stringify(detail),
        changeType: levelChanged ? 'level_change' : 'auto_update',
        logType: ActivityLogType.MANUAL_REFRESH,
        fluctuationAmount,
        isAbnormal: isAbnormalFluctuation ? 1 : 0,
        abnormalType: isAbnormalFluctuation ? ActivityAbnormalType.ABNORMAL_FLUCTUATION : undefined,
        operatorId: operator.userId,
        operatorName: operator.username,
        remark: 'Manual activity data refresh'
      } as any, { transaction: t })

      await t.commit()

      return {
        success: true,
        oldScore,
        newScore,
        oldLevel,
        newLevel,
        levelChanged,
        strategyChange: strategyChangeResult
      }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async getStrategies(): Promise<{
    list: any[]
    strategyTypes: Record<string, string>
    levelStrategyMap: Record<number, string[]>
  }> {
    const strategies = await ActivityOperationStrategy.findAll({
      order: [['priority', 'DESC'], ['createTime', 'DESC']]
    })

    const list = strategies.map((s: any) => {
      const data = s.toJSON()
      if (data.targetCondition) {
        try { data.targetCondition = JSON.parse(data.targetCondition) } catch { /* ignore */ }
      }
      if (data.benefits) {
        try { data.benefits = JSON.parse(data.benefits) } catch { /* ignore */ }
      }
      data.strategyTypeName = OPERATION_STRATEGY_NAMES[data.strategyType] || data.strategyType
      return data
    })

    return {
      list,
      strategyTypes: OPERATION_STRATEGY_NAMES,
      levelStrategyMap: ACTIVITY_LEVEL_STRATEGY_MAP
    }
  },

  async updateStrategy(
    id: number,
    data: Partial<{
      strategyName: string
      strategyType: string
      targetActivityLevel: string
      targetCondition: any
      content: string
      benefits: any
      triggerMode: string
      triggerTime: Date
      status: number
      priority: number
      autoApply: number
      remark: string
    }>,
    operator: OperatorInfo
  ): Promise<{ success: boolean; message: string }> {
    const permCheck = await this.checkPermission(operator, 'manage_strategy')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const strategy = await ActivityOperationStrategy.findByPk(id)
    if (!strategy) {
      throw new AppError('Strategy not found', 404)
    }

    const updates: any = {}
    if (data.strategyName !== undefined) updates.strategyName = data.strategyName
    if (data.strategyType !== undefined) updates.strategyType = data.strategyType
    if (data.targetActivityLevel !== undefined) updates.targetActivityLevel = data.targetActivityLevel
    if (data.targetCondition !== undefined) updates.targetCondition = JSON.stringify(data.targetCondition)
    if (data.content !== undefined) updates.content = data.content
    if (data.benefits !== undefined) updates.benefits = JSON.stringify(data.benefits)
    if (data.triggerMode !== undefined) updates.triggerMode = data.triggerMode
    if (data.triggerTime !== undefined) updates.triggerTime = data.triggerTime
    if (data.status !== undefined) updates.status = data.status
    if (data.priority !== undefined) updates.priority = data.priority
    if (data.autoApply !== undefined) updates.autoApply = data.autoApply
    if (data.remark !== undefined) updates.remark = data.remark

    updates.operatorId = operator.userId
    updates.operatorName = operator.username

    await strategy.update(updates)

    return { success: true, message: 'Strategy updated successfully' }
  },

  async getUserStrategies(userId: number, operator: OperatorInfo): Promise<{
    activeStrategies: any[]
    availableStrategies: any[]
    user: any
  }> {
    const permCheck = await this.checkPermission(operator, 'view_detail')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      throw new AppError('User not found', 404)
    }

    const activeStrategyIds = user.activityStrategies ? JSON.parse(user.activityStrategies) : []
    const activeStrategies = activeStrategyIds.length > 0
      ? await ActivityOperationStrategy.findAll({
          where: { id: { [Op.in]: activeStrategyIds } }
        })
      : []

    const userLevel = user.activityLevel ?? ActivityLevel.LOW
    const availableStrategyTypes = ACTIVITY_LEVEL_STRATEGY_MAP[userLevel] || []

    const availableStrategies = await ActivityOperationStrategy.findAll({
      where: {
        status: 1,
        strategyType: { [Op.in]: availableStrategyTypes }
      }
    })

    const processedActive = activeStrategies.map((s: any) => {
      const data = s.toJSON()
      data.strategyTypeName = OPERATION_STRATEGY_NAMES[data.strategyType]
      return data
    })

    const processedAvailable = availableStrategies.map((s: any) => {
      const data = s.toJSON()
      data.strategyTypeName = OPERATION_STRATEGY_NAMES[data.strategyType]
      return data
    })

    const userData = user.toJSON() as any
    userData.activityLevelName = ACTIVITY_LEVEL_NAMES[userLevel as number]

    return {
      activeStrategies: processedActive,
      availableStrategies: processedAvailable,
      user: userData
    }
  },

  async batchExecuteOperation(
    data: BatchOperationData,
    operator: OperatorInfo
  ): Promise<{
    total: number
    success: number
    fail: number
    results: Array<{
      userId: number
      success: boolean
      error?: string
      details?: any
    }>
  }> {
    const permCheck = await this.checkPermission(operator, 'batch_operation')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const { operationType, userIds, strategyIds, executeType, scheduledTime, remark } = data

    if (userIds.length === 0) {
      return { total: 0, success: 0, fail: 0, results: [] }
    }

    const validTypes = [
      ActivityBatchType.WAKE_UP_SLEEPING,
      ActivityBatchType.GRANT_BENEFIT_HIGH,
      ActivityBatchType.MARK_FOCUS_LOW
    ]

    if (!validTypes.includes(operationType as ActivityBatchType)) {
      throw new AppError(`Invalid operation type: ${operationType}`, 400)
    }

    if (executeType === 'scheduled') {
      if (!scheduledTime) {
        throw new AppError('Scheduled time is required for scheduled execution', 400)
      }
      if (new Date(scheduledTime) <= new Date()) {
        throw new AppError('Scheduled time must be in the future', 400)
      }

      const record = await ActivityOperationRecord.create({
        operationName: ACTIVITY_BATCH_TYPE_NAMES[operationType as ActivityBatchType] || operationType,
        operationType: 'scheduled',
        batchType: operationType,
        userScope: JSON.stringify({ userIds, strategyIds }),
        userCount: userIds.length,
        executeType: OperationExecuteType.SCHEDULED,
        executeTime: new Date(scheduledTime),
        status: OperationStatus.SCHEDULED,
        operatorId: operator.userId,
        operatorName: operator.username,
        remark
      } as any)

      return {
        total: userIds.length,
        success: 0,
        fail: 0,
        results: userIds.map(uid => ({
          userId: uid,
          success: true,
          details: { scheduled: true, recordId: record.id, scheduledTime }
        }))
      }
    }

    const results: Array<{
      userId: number
      success: boolean
      error?: string
      details?: any
    }> = []
    let successCount = 0
    let failCount = 0

    const t = await sequelize.transaction()

    try {
      const record = await ActivityOperationRecord.create({
        operationName: ACTIVITY_BATCH_TYPE_NAMES[operationType as ActivityBatchType] || operationType,
        operationType: 'batch',
        batchType: operationType,
        userScope: JSON.stringify({ userIds, strategyIds }),
        userCount: userIds.length,
        executeType: OperationExecuteType.IMMEDIATE,
        executeTime: new Date(),
        status: OperationStatus.RUNNING,
        operatorId: operator.userId,
        operatorName: operator.username,
        remark
      } as any, { transaction: t })

      await t.commit()

      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i]
        try {
          const details = await this._executeSingleOperation(userId, operationType, strategyIds, operator)
          successCount++
          results.push({ userId, success: true, details })
        } catch (error: any) {
          failCount++
          results.push({ userId, success: false, error: error.message })
        }

        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      await record.update({
        successCount,
        failCount,
        status: OperationStatus.COMPLETED,
        executeEndTime: new Date(),
        operationResult: `Success: ${successCount}, Failed: ${failCount}`,
        detail: JSON.stringify(results)
      })

      return {
        total: userIds.length,
        success: successCount,
        fail: failCount,
        results
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  },

  async _executeSingleOperation(
    userId: number,
    operationType: string,
    strategyIds: number[] | undefined,
    operator: OperatorInfo
  ): Promise<any> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error('User not found')
    }

    switch (operationType) {
      case ActivityBatchType.WAKE_UP_SLEEPING: {
        if (user.activityLevel !== ActivityLevel.SLEEPER) {
          throw new Error('User is not a sleeper')
        }

        const wakeupStrategies = strategyIds && strategyIds.length > 0
          ? await ActivityOperationStrategy.findAll({
              where: {
                id: { [Op.in]: strategyIds },
                status: 1,
                strategyType: { [Op.in]: [OperationStrategyType.WAKEUP_MESSAGE, OperationStrategyType.BENEFIT_GRANT] }
              }
            })
          : await ActivityOperationStrategy.findAll({
              where: {
                status: 1,
                strategyType: OperationStrategyType.WAKEUP_MESSAGE,
                autoApply: 1
              }
            })

        const currentStrategies = user.activityStrategies ? JSON.parse(user.activityStrategies) : []
        const newStrategyIds = [...new Set([...currentStrategies, ...wakeupStrategies.map(s => s.id)])]

        await user.update({
          activityStrategies: JSON.stringify(newStrategyIds)
        })

        await ActivityScoreLog.create({
          userId,
          userName: user.username,
          oldLevel: user.activityLevel ?? ActivityLevel.SLEEPER,
          newLevel: user.activityLevel ?? ActivityLevel.SLEEPER,
          oldScore: user.activityScore ?? 0,
          newScore: user.activityScore ?? 0,
          changeType: 'batch_operation',
          logType: ActivityLogType.BATCH_OPERATION,
          scoreDetail: JSON.stringify({ operation: 'wake_up', strategyIds: wakeupStrategies.map(s => s.id) }),
          operatorId: operator.userId,
          operatorName: operator.username,
          remark: 'Batch wake up sleeping user'
        } as any)

        return { operation: 'wake_up', strategiesApplied: wakeupStrategies.length }
      }

      case ActivityBatchType.GRANT_BENEFIT_HIGH: {
        if (user.activityLevel !== ActivityLevel.HIGH) {
          throw new Error('User is not high activity level')
        }

        const benefitStrategies = strategyIds && strategyIds.length > 0
          ? await ActivityOperationStrategy.findAll({
              where: {
                id: { [Op.in]: strategyIds },
                status: 1,
                strategyType: { [Op.in]: [OperationStrategyType.BENEFIT_GRANT, OperationStrategyType.FLOW_BOOST] }
              }
            })
          : await ActivityOperationStrategy.findAll({
              where: {
                status: 1,
                strategyType: { [Op.in]: [OperationStrategyType.FLOW_BOOST, OperationStrategyType.ACTIVITY_PRIORITY] },
                autoApply: 1
              }
            })

        const currentStrategies = user.activityStrategies ? JSON.parse(user.activityStrategies) : []
        const newStrategyIds = [...new Set([...currentStrategies, ...benefitStrategies.map(s => s.id)])]

        await user.update({
          activityStrategies: JSON.stringify(newStrategyIds)
        })

        await ActivityScoreLog.create({
          userId,
          userName: user.username,
          oldLevel: user.activityLevel ?? ActivityLevel.HIGH,
          newLevel: user.activityLevel ?? ActivityLevel.HIGH,
          oldScore: user.activityScore ?? 0,
          newScore: user.activityScore ?? 0,
          changeType: 'batch_operation',
          logType: ActivityLogType.BATCH_OPERATION,
          scoreDetail: JSON.stringify({ operation: 'grant_benefit', strategyIds: benefitStrategies.map(s => s.id) }),
          operatorId: operator.userId,
          operatorName: operator.username,
          remark: 'Batch grant high activity benefits'
        } as any)

        return { operation: 'grant_benefit', strategiesApplied: benefitStrategies.length }
      }

      case ActivityBatchType.MARK_FOCUS_LOW: {
        if (user.activityLevel !== ActivityLevel.LOW) {
          throw new Error('User is not low activity level')
        }

        await user.update({
          isFocusMaintenance: 1
        })

        const focusStrategies = strategyIds && strategyIds.length > 0
          ? await ActivityOperationStrategy.findAll({
              where: {
                id: { [Op.in]: strategyIds },
                status: 1,
                strategyType: OperationStrategyType.FOCUS_MAINTENANCE
              }
            })
          : []

        if (focusStrategies.length > 0) {
          const currentStrategies = user.activityStrategies ? JSON.parse(user.activityStrategies) : []
          const newStrategyIds = [...new Set([...currentStrategies, ...focusStrategies.map(s => s.id)])]
          await user.update({
            activityStrategies: JSON.stringify(newStrategyIds)
          })
        }

        await ActivityScoreLog.create({
          userId,
          userName: user.username,
          oldLevel: user.activityLevel ?? ActivityLevel.LOW,
          newLevel: user.activityLevel ?? ActivityLevel.LOW,
          oldScore: user.activityScore ?? 0,
          newScore: user.activityScore ?? 0,
          changeType: 'batch_operation',
          logType: ActivityLogType.BATCH_OPERATION,
          scoreDetail: JSON.stringify({ operation: 'mark_focus', focus: true }),
          operatorId: operator.userId,
          operatorName: operator.username,
          remark: 'Batch mark low activity focus maintenance'
        } as any)

        return { operation: 'mark_focus', marked: true }
      }

      default:
        throw new Error(`Unsupported operation: ${operationType}`)
    }
  },

  async getActivityScoreLogs(
    params: ScoreLogQueryParams,
    operator: OperatorInfo
  ): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
  }> {
    const permCheck = await this.checkPermission(operator, 'view_logs')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const { page, pageSize, userId, startTime, endTime, logType, isAbnormal, operatorId } = params

    const where: any = {}

    if (userId !== undefined) {
      where.userId = userId
    }
    if (startTime) {
      where.createTime = { ...where.createTime, [Op.gte]: new Date(startTime) }
    }
    if (endTime) {
      where.createTime = { ...where.createTime, [Op.lte]: new Date(endTime) }
    }
    if (logType) {
      where.logType = logType
    }
    if (isAbnormal !== undefined) {
      where.isAbnormal = isAbnormal
    }
    if (operatorId !== undefined) {
      where.operatorId = operatorId
    }

    const { count, rows } = await ActivityScoreLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createTime', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }]
    })

    const list = rows.map((row: any) => {
      const data = row.toJSON()
      if (data.scoreDetail) {
        try { data.scoreDetail = JSON.parse(data.scoreDetail) } catch { /* ignore */ }
      }
      data.logTypeName = ACTIVITY_LOG_TYPE_NAMES[data.logType] || data.logType
      if (data.abnormalType) {
        data.abnormalTypeName = ACTIVITY_ABNORMAL_NAMES[data.abnormalType] || data.abnormalType
      }
      return data
    })

    return {
      list,
      total: count,
      page,
      pageSize
    }
  },

  async detectAbnormalActivity(
    userId: number,
    logId?: number
  ): Promise<{
    hasAbnormal: boolean
    abnormalities: Array<{
      type: string
      typeName: string
      severity: 'low' | 'medium' | 'high'
      description: string
      evidence: any
    }>
    overallScore: number
  }> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    const abnormalities: Array<{
      type: string
      typeName: string
      severity: 'low' | 'medium' | 'high'
      description: string
      evidence: any
    }> = []

    const { detail, totalScore: calculatedScore } = await this.calculateActivityScore(userId)
    const storedScore = user.activityScore ?? 0
    const scoreDiff = Math.abs(calculatedScore - storedScore)

    if (scoreDiff > 10) {
      abnormalities.push({
        type: ActivityAbnormalType.FAKE_SCORE,
        typeName: ACTIVITY_ABNORMAL_NAMES[ActivityAbnormalType.FAKE_SCORE],
        severity: scoreDiff > 30 ? 'high' : 'medium',
        description: 'Score does not match actual behavior data',
        evidence: {
          storedScore,
          calculatedScore,
          difference: scoreDiff,
          detail
        }
      })
    }

    let baseWhere: any = { userId }
    if (logId) {
      const specificLog = await ActivityScoreLog.findByPk(logId)
      if (specificLog) {
        const logTime = specificLog.createTime || new Date()
        baseWhere.createTime = {
          [Op.gte]: new Date(logTime.getTime() - SEVEN_DAYS_MS),
          [Op.lte]: new Date(logTime.getTime() + SEVEN_DAYS_MS)
        }
      }
    }

    const recentLogs = await ActivityScoreLog.findAll({
      where: baseWhere,
      order: [['createTime', 'ASC']],
      limit: 30
    })

    if (recentLogs.length >= 2) {
      let consecutiveAbnormal = 0

      for (let i = 1; i < recentLogs.length; i++) {
        const fluctuation = Math.abs((recentLogs[i] as any).newScore - (recentLogs[i - 1] as any).newScore)

        if (fluctuation > ABNORMAL_FLUCTUATION_THRESHOLD) {
          consecutiveAbnormal++

          if (consecutiveAbnormal >= CONSECUTIVE_ABNORMAL_THRESHOLD) {
            abnormalities.push({
              type: ActivityAbnormalType.ABNORMAL_FLUCTUATION,
              typeName: ACTIVITY_ABNORMAL_NAMES[ActivityAbnormalType.ABNORMAL_FLUCTUATION],
              severity: 'high',
              description: `Consecutive abnormal fluctuations detected (${consecutiveAbnormal} times)`,
              evidence: {
                threshold: ABNORMAL_FLUCTUATION_THRESHOLD,
                consecutiveCount: consecutiveAbnormal,
                fluctuations: recentLogs.slice(
                  Math.max(0, i - consecutiveAbnormal),
                  i + 1
                ).map(l => ({
                  time: l.createTime,
                  score: (l as any).newScore,
                  fluctuation: l.fluctuationAmount
                }))
              }
            })
            break
          } else {
            abnormalities.push({
              type: ActivityAbnormalType.ABNORMAL_FLUCTUATION,
              typeName: ACTIVITY_ABNORMAL_NAMES[ActivityAbnormalType.ABNORMAL_FLUCTUATION],
              severity: fluctuation > 50 ? 'high' : 'medium',
              description: `Single fluctuation ${fluctuation} exceeds threshold ${ABNORMAL_FLUCTUATION_THRESHOLD}`,
              evidence: {
                time: recentLogs[i].createTime,
                oldScore: (recentLogs[i] as any).oldScore,
                newScore: (recentLogs[i] as any).newScore,
                fluctuation,
                threshold: ABNORMAL_FLUCTUATION_THRESHOLD
              }
            })
          }
        } else {
          consecutiveAbnormal = 0
        }
      }
    }

    const weekAgo = new Date(Date.now() - SEVEN_DAYS_MS)
    const [weeklyNotes, weeklyComments] = await Promise.all([
      Note.count({
        where: {
          authorId: userId,
          status: 2,
          publishTime: { [Op.gte]: weekAgo }
        } as any
      }),
      Comment.count({
        where: {
          userId,
          status: 1,
          createTime: { [Op.gte]: weekAgo }
        } as any
      })
    ])

    if (weeklyComments > 0 && weeklyNotes === 0) {
      const commentToPublishRatio = weeklyComments
      if (commentToPublishRatio > 50) {
        abnormalities.push({
          type: ActivityAbnormalType.FAKE_INTERACT,
          typeName: ACTIVITY_ABNORMAL_NAMES[ActivityAbnormalType.FAKE_INTERACT],
          severity: commentToPublishRatio > 100 ? 'high' : 'medium',
          description: 'Suspicious comment-to-publish ratio indicates potential fake interactions',
          evidence: {
            weeklyComments,
            weeklyNotes,
            ratio: commentToPublishRatio
          }
        })
      }
    }

    const weeklyLikeRaw = user.weeklyLikeCount || 0
    const weeklyInteractRaw = user.weeklyInteractionCount || 0

    if (weeklyLikeRaw > 0 && weeklyInteractRaw > 0) {
      const likeRatio = weeklyLikeRaw / Math.max(1, weeklyInteractRaw)
      if (likeRatio > 10) {
        abnormalities.push({
          type: ActivityAbnormalType.SUSPICIOUS_PATTERN,
          typeName: ACTIVITY_ABNORMAL_NAMES[ActivityAbnormalType.SUSPICIOUS_PATTERN],
          severity: likeRatio > 20 ? 'high' : 'medium',
          description: 'Suspicious behavior pattern: excessive likes relative to other interactions',
          evidence: {
            weeklyLikes: weeklyLikeRaw,
            weeklyInteractions: weeklyInteractRaw,
            ratio: Math.round(likeRatio * 100) / 100
          }
        })
      }
    }

    if (recentLogs.length > 0 && recentLogs.length < 7) {
      const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)
      const firstLog = recentLogs[0]
      if ((firstLog.createTime || new Date()) > sevenDaysAgo) {
        const expectedDays = Math.ceil((Date.now() - Math.max(sevenDaysAgo.getTime(), (firstLog.createTime || new Date()).getTime())) / (24 * 60 * 60 * 1000))
        if (recentLogs.length < expectedDays) {
          abnormalities.push({
            type: ActivityAbnormalType.DATA_DISCONTINUITY,
            typeName: ACTIVITY_ABNORMAL_NAMES[ActivityAbnormalType.DATA_DISCONTINUITY],
            severity: 'low',
            description: 'Daily activity data is incomplete',
            evidence: {
              expectedDays,
              actualRecords: recentLogs.length,
              missingDays: expectedDays - recentLogs.length
            }
          })
        }
      }
    }

    const highCount = abnormalities.filter(a => a.severity === 'high').length
    const mediumCount = abnormalities.filter(a => a.severity === 'medium').length
    const lowCount = abnormalities.filter(a => a.severity === 'low').length
    const overallScore = Math.max(0, 100 - (highCount * 30 + mediumCount * 15 + lowCount * 5))

    return {
      hasAbnormal: abnormalities.length > 0,
      abnormalities,
      overallScore
    }
  },

  async generateAbnormalWarningList(
    params: AbnormalWarningParams
  ): Promise<{
    list: Array<{
      userId: number
      username: string
      nickname: string
      activityLevel: number
      activityLevelName: string
      activityScore: number
      abnormalities: any[]
      overallScore: number
      lastDetectTime: Date
    }>
    total: number
    page: number
    pageSize: number
  }> {
    const { page, pageSize, abnormalType, activityLevel } = params
    const offset = (page - 1) * pageSize

    const userWhere: any = { status: 1 }
    if (activityLevel !== undefined) {
      userWhere.activityLevel = activityLevel
    }

    const users = await User.findAll({
      where: userWhere,
      attributes: ['id', 'username', 'nickname', 'activityLevel', 'activityScore', 'lastActivityUpdateTime'],
      limit: pageSize * 3,
      offset,
      order: [['activityScore', 'ASC']]
    })

    const warningList: Array<{
      userId: number
      username: string
      nickname: string
      activityLevel: number
      activityLevelName: string
      activityScore: number
      abnormalities: any[]
      overallScore: number
      lastDetectTime: Date
    }> = []

    for (const user of users) {
      const detection = await this.detectAbnormalActivity(user.id)

      let filteredAbnormalities = detection.abnormalities
      if (abnormalType) {
        filteredAbnormalities = filteredAbnormalities.filter(a => a.type === abnormalType)
      }

      if (filteredAbnormalities.length > 0) {
        warningList.push({
          userId: user.id,
          username: user.username,
          nickname: user.nickname,
          activityLevel: user.activityLevel ?? 0,
          activityLevelName: ACTIVITY_LEVEL_NAMES[user.activityLevel ?? 0],
          activityScore: user.activityScore ?? 0,
          abnormalities: filteredAbnormalities,
          overallScore: detection.overallScore,
          lastDetectTime: new Date()
        })
      }

      if (warningList.length >= pageSize) {
        break
      }
    }

    return {
      list: warningList,
      total: warningList.length + offset,
      page,
      pageSize
    }
  },

  async validateActivityData(userId: number): Promise<{
    valid: boolean
    checks: {
      continuity: { passed: boolean; message?: string; details?: any }
      consistency: { passed: boolean; message?: string; details?: any }
      rationality: { passed: boolean; message?: string; details?: any }
    }
    summary: string
  }> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    const checks = {
      continuity: { passed: true, message: '' as string | undefined, details: undefined as any },
      consistency: { passed: true, message: '' as string | undefined, details: undefined as any },
      rationality: { passed: true, message: '' as string | undefined, details: undefined as any }
    }

    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)
    const dailyLogs = await ActivityScoreLog.findAll({
      where: {
        userId,
        createTime: { [Op.gte]: sevenDaysAgo }
      },
      order: [['createTime', 'ASC']]
    })

    const logDates = new Set(
      dailyLogs.map(log => {
        const d = log.createTime || new Date()
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      })
    )

    const expectedDates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      expectedDates.push(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)
    }

    const missingDates = expectedDates.filter(d => !logDates.has(d))

    if (missingDates.length > 0) {
      checks.continuity.passed = false
      checks.continuity.message = `Missing ${missingDates.length} day(s) of activity data in the last 7 days`
      checks.continuity.details = {
        expected: 7,
        actual: logDates.size,
        missingDates
      }
    } else {
      checks.continuity.message = '7-day data continuity check passed'
    }

    const storedDetail = user.activityScoreDetail
    let storedDetailParsed: ActivityScoreDetail | null = null
    if (storedDetail) {
      try {
        storedDetailParsed = JSON.parse(storedDetail)
      } catch {
        storedDetailParsed = null
      }
    }

    const { detail, totalScore } = await this.calculateActivityScore(userId)
    const storedScore = user.activityScore ?? 0

    if (storedDetailParsed) {
      const storedTotalFromDetail = Math.round(
        (storedDetailParsed.dailyLogin || 0) +
        (storedDetailParsed.weeklyLogin || 0) +
        (storedDetailParsed.monthlyLogin || 0) +
        (storedDetailParsed.publish || 0) +
        (storedDetailParsed.comment || 0) +
        (storedDetailParsed.like || 0) +
        (storedDetailParsed.interact || 0) +
        (storedDetailParsed.share || 0)
      )

      if (Math.abs(storedTotalFromDetail - storedScore) > 1) {
        checks.consistency.passed = false
        checks.consistency.message = 'Stored total score does not match sum of detail components'
        checks.consistency.details = {
          storedTotalScore: storedScore,
          calculatedFromDetail: storedTotalFromDetail,
          difference: Math.abs(storedTotalFromDetail - storedScore)
        }
      } else {
        checks.consistency.message = 'Score consistency check passed'
      }
    } else {
      checks.consistency.message = 'No stored detail data available for consistency check'
    }

    const scoreDiff = Math.abs(totalScore - storedScore)
    const threshold = 15

    if (scoreDiff > threshold) {
      checks.rationality.passed = false
      checks.rationality.message = `Stored score deviates ${scoreDiff} points from recalculated score (threshold: ${threshold})`
      checks.rationality.details = {
        storedScore,
        recalculatedScore: totalScore,
        difference: scoreDiff,
        threshold,
        recalculatedDetail: detail
      }
    } else {
      const ratioChecks: any[] = []
      let ratioPassed = true

      const weeklyPublish = user.weeklyPublishCount || 0
      const weeklyComment = user.weeklyCommentCount || 0
      const weeklyLike = user.weeklyLikeCount || 0

      if (weeklyPublish > 0 && weeklyComment > weeklyPublish * 50) {
        ratioPassed = false
        ratioChecks.push({
          metric: 'comment/publish',
          value: weeklyComment / weeklyPublish,
          threshold: 50,
          problem: 'Comments exceed 50x publishes'
        })
      }

      if (weeklyLike > 0 && weeklyPublish > 0 && weeklyLike > weeklyPublish * 200) {
        ratioPassed = false
        ratioChecks.push({
          metric: 'like/publish',
          value: weeklyLike / weeklyPublish,
          threshold: 200,
          problem: 'Likes exceed 200x publishes'
        })
      }

      if (!ratioPassed) {
        checks.rationality.passed = false
        checks.rationality.message = 'Behavior ratio analysis indicates potential anomalies'
        checks.rationality.details = {
          ratioChecks,
          storedScore,
          recalculatedScore: totalScore
        }
      } else {
        checks.rationality.message = 'Rationality check passed'
      }
    }

    const allPassed = checks.continuity.passed && checks.consistency.passed && checks.rationality.passed
    const failedChecks = []
    if (!checks.continuity.passed) failedChecks.push('continuity')
    if (!checks.consistency.passed) failedChecks.push('consistency')
    if (!checks.rationality.passed) failedChecks.push('rationality')

    const summary = allPassed
      ? 'All validation checks passed'
      : `Validation failed on: ${failedChecks.join(', ')}`

    return {
      valid: allPassed,
      checks,
      summary
    }
  }
}
