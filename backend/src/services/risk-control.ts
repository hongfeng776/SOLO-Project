import { User, BehaviorLog, RiskControlLog, PunishmentRecord } from '@/models/index'
import { AppError } from '@/utils/response'
import { Op } from 'sequelize'
import {
  BehaviorType,
  RiskLevel,
  RISK_LEVEL_NAMES,
  ViolationType,
  VIOLATION_TYPE_NAMES,
  PunishmentType,
  PUNISHMENT_TYPE_NAMES,
  RISK_PUNISHMENT_MAP,
  PunishmentStatus,
  PUNISHMENT_STATUS_NAMES,
  BEHAVIOR_FREQUENCY_LIMITS
} from '@/enums/business'
import sequelize from '@config/database'

interface OperatorInfo {
  userId: number
  username: string
  roles: string[]
  permissions: string[]
}

interface BehaviorMonitorData {
  targetId?: number
  targetType?: string
  content?: string
  ip?: string
  userAgent?: string
}

interface BehaviorLogQueryParams {
  page: number
  pageSize: number
  userId?: number
  behaviorType?: string
  isAbnormal?: number
  riskLevel?: number
  startTime?: string
  endTime?: string
}

interface PunishmentListQueryParams {
  page: number
  pageSize: number
  userId?: number
  punishmentType?: string
  riskLevel?: number
  status?: number
  startTime?: string
  endTime?: string
}

interface BatchHandleParams {
  userIds: number[]
  action: 'release_minor' | 'ban_severe'
  reason: string
}

const PUNISHMENT_DURATIONS: Record<string, number> = {
  [PunishmentType.WARNING]: 0,
  [PunishmentType.TEMP_RESTRICT]: 30,
  [PunishmentType.FLOW_LIMIT]: 1440,
  [PunishmentType.CONTENT_DOWNGRADE]: 1440,
  [PunishmentType.TEMP_BAN]: 10080,
  [PunishmentType.PERMANENT_BAN]: 0
}

function getTimePeriod(date: Date): string {
  const hour = date.getHours()
  if (hour >= 0 && hour < 6) return 'late_night'
  if (hour >= 6 && hour < 9) return 'early_morning'
  if (hour >= 9 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 14) return 'noon'
  if (hour >= 14 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

function calculateRiskScore(frequencyRatio: number, hasViolationHistory: boolean, isAbnormalTime: boolean): number {
  let score = 0
  score += Math.min(40, Math.round(frequencyRatio * 20))
  if (hasViolationHistory) score += 20
  if (isAbnormalTime) score += 15
  return Math.min(100, score)
}

export const riskControlService = {
  async monitorBehavior(
    userId: number,
    behaviorType: string,
    data: BehaviorMonitorData
  ): Promise<{
    isAbnormal: boolean
    riskLevel: number
    violationType?: string
    intercepted: boolean
  }> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const now = new Date()
    const timePeriod = getTimePeriod(now)
    const limit = BEHAVIOR_FREQUENCY_LIMITS[behaviorType]

    let frequency = 1
    let isAbnormal = false
    let violationType: string | undefined
    let riskLevel = RiskLevel.NONE

    if (limit) {
      const windowStart = new Date(now.getTime() - limit.window * 1000)
      const recentCount = await BehaviorLog.count({
        where: {
          userId,
          behaviorType,
          createTime: { [Op.gte]: windowStart }
        }
      })
      frequency = recentCount + 1

      if (frequency > limit.max) {
        isAbnormal = true
        const ratio = frequency / limit.max

        if (ratio >= 3) {
          riskLevel = RiskLevel.HIGH
          violationType = ViolationType.FREQUENT_OPERATION
        } else if (ratio >= 2) {
          riskLevel = RiskLevel.MEDIUM
          violationType = behaviorType === BehaviorType.LIKE
            ? ViolationType.BATCH_LIKE
            : ViolationType.SPAM
        } else {
          riskLevel = RiskLevel.LOW
          violationType = ViolationType.FREQUENT_OPERATION
        }
      }
    }

    if (timePeriod === 'late_night' && frequency > 1) {
      isAbnormal = true
      if (riskLevel < RiskLevel.LOW) {
        riskLevel = RiskLevel.LOW
        violationType = ViolationType.ABNORMAL_TIME
      }
    }

    if (data.content) {
      const suspiciousPatterns = /加微|加V|私聊|兼职|赚钱|免费领|扫码|红包返/
      if (suspiciousPatterns.test(data.content)) {
        isAbnormal = true
        riskLevel = Math.max(riskLevel, RiskLevel.MEDIUM)
        violationType = ViolationType.MALICIOUS_TRAFFIC
      }
    }

    let intercepted = false
    if (riskLevel >= RiskLevel.HIGH) {
      intercepted = true
    }

    await BehaviorLog.create({
      userId,
      userName: user.username,
      behaviorType,
      targetId: data.targetId,
      targetType: data.targetType,
      content: data.content,
      ip: data.ip,
      userAgent: data.userAgent,
      isAbnormal: isAbnormal ? 1 : 0,
      abnormalType: violationType,
      riskLevel,
      frequency,
      timePeriod,
      intercepted: intercepted ? 1 : 0
    } as any)

    if (isAbnormal && riskLevel >= RiskLevel.MEDIUM) {
      const riskScore = calculateRiskScore(
        limit ? frequency / limit.max : 1,
        (user.violationCount ?? 0) > 0,
        timePeriod === 'late_night'
      )

      await user.update({
        riskLevel: Math.max(user.riskLevel ?? 0, riskLevel),
        riskScore: Math.max(user.riskScore ?? 0, riskScore),
        lastViolationTime: now,
        violationCount: (user.violationCount ?? 0) + 1
      })

      if (riskLevel >= RiskLevel.HIGH) {
        await this.applyPunishment(userId, riskLevel, violationType!, undefined)
      }
    }

    return { isAbnormal, riskLevel, violationType, intercepted }
  },

  async getBehaviorLogs(params: BehaviorLogQueryParams): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
  }> {
    const { page, pageSize, userId, behaviorType, isAbnormal, riskLevel, startTime, endTime } = params

    const where: any = {}
    if (userId !== undefined) where.userId = userId
    if (behaviorType) where.behaviorType = behaviorType
    if (isAbnormal !== undefined) where.isAbnormal = isAbnormal
    if (riskLevel !== undefined) where.riskLevel = riskLevel
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: new Date(startTime) }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: new Date(endTime) }

    const { count, rows } = await BehaviorLog.findAndCountAll({
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

    return { list: rows, total: count, page, pageSize }
  },

  async getRiskControlList(params: {
    page: number
    pageSize: number
    userId?: number
    riskLevel?: number
    violationType?: string
    intercepted?: number
    startTime?: string
    endTime?: string
  }): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
  }> {
    const { page, pageSize, userId, riskLevel, violationType, intercepted, startTime, endTime } = params

    const where: any = {}
    if (userId !== undefined) where.userId = userId
    if (riskLevel !== undefined) where.riskLevel = riskLevel
    if (violationType) where.violationType = violationType
    if (intercepted !== undefined) where.intercepted = intercepted
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: new Date(startTime) }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: new Date(endTime) }

    const { count, rows } = await RiskControlLog.findAndCountAll({
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

    return { list: rows, total: count, page, pageSize }
  },

  async detectAnomaly(userId: number, behaviorType: string): Promise<{
    isAnomaly: boolean
    riskLevel: number
    riskLevelName: string
    violationTypes: string[]
    frequencyData: Record<string, { count: number; max: number; ratio: number }>
  }> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const now = new Date()
    const violationTypes: string[] = []
    const frequencyData: Record<string, { count: number; max: number; ratio: number }> = {}
    let maxRiskLevel = RiskLevel.NONE

    const typesToCheck = behaviorType === 'all'
      ? Object.keys(BEHAVIOR_FREQUENCY_LIMITS)
      : [behaviorType]

    for (const bt of typesToCheck) {
      const limit = BEHAVIOR_FREQUENCY_LIMITS[bt]
      if (!limit) continue

      const windowStart = new Date(now.getTime() - limit.window * 1000)
      const count = await BehaviorLog.count({
        where: {
          userId,
          behaviorType: bt,
          createTime: { [Op.gte]: windowStart }
        }
      })

      const ratio = count / limit.max
      frequencyData[bt] = { count, max: limit.max, ratio: Math.round(ratio * 100) / 100 }

      if (count > limit.max) {
        if (ratio >= 3) {
          maxRiskLevel = Math.max(maxRiskLevel, RiskLevel.HIGH)
          violationTypes.push(ViolationType.FREQUENT_OPERATION)
        } else if (ratio >= 2) {
          maxRiskLevel = Math.max(maxRiskLevel, RiskLevel.MEDIUM)
          violationTypes.push(bt === BehaviorType.LIKE ? ViolationType.BATCH_LIKE : ViolationType.SPAM)
        } else {
          maxRiskLevel = Math.max(maxRiskLevel, RiskLevel.LOW)
          violationTypes.push(ViolationType.FREQUENT_OPERATION)
        }
      }
    }

    const lateNightStart = new Date(now)
    lateNightStart.setHours(0, 0, 0, 0)
    const lateNightLogs = await BehaviorLog.count({
      where: {
        userId,
        timePeriod: 'late_night',
        createTime: { [Op.gte]: lateNightStart }
      }
    })
    if (lateNightLogs > 5) {
      maxRiskLevel = Math.max(maxRiskLevel, RiskLevel.LOW)
      if (!violationTypes.includes(ViolationType.ABNORMAL_TIME)) {
        violationTypes.push(ViolationType.ABNORMAL_TIME)
      }
    }

    return {
      isAnomaly: maxRiskLevel > RiskLevel.NONE,
      riskLevel: maxRiskLevel,
      riskLevelName: RISK_LEVEL_NAMES[maxRiskLevel],
      violationTypes,
      frequencyData
    }
  },

  async interceptBehavior(
    userId: number,
    reason: string,
    operator?: OperatorInfo
  ): Promise<{
    success: boolean
    logId: number
  }> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const now = new Date()
    const recentBehaviors = await BehaviorLog.findAll({
      where: {
        userId,
        isAbnormal: 1,
        createTime: { [Op.gte]: new Date(now.getTime() - 60 * 60 * 1000) }
      },
      order: [['createTime', 'DESC']],
      limit: 10
    })

    const violationType = recentBehaviors.length > 0
      ? (recentBehaviors[0] as any).abnormalType || ViolationType.FREQUENT_OPERATION
      : ViolationType.FREQUENT_OPERATION

    const riskLevel = recentBehaviors.length > 0
      ? Math.max(...recentBehaviors.map((b: any) => b.riskLevel || 0))
      : RiskLevel.LOW

    const t = await sequelize.transaction()
    try {
      await BehaviorLog.update(
        { intercepted: 1 },
        {
          where: {
            userId,
            isAbnormal: 1,
            intercepted: 0,
            createTime: { [Op.gte]: new Date(now.getTime() - 60 * 60 * 1000) }
          },
          transaction: t
        }
      )

      const log = await RiskControlLog.create({
        userId,
        userName: user.username,
        violationType,
        riskLevel,
        behaviorDetail: JSON.stringify(recentBehaviors.map((b: any) => ({
          behaviorType: b.behaviorType,
          frequency: b.frequency,
          timePeriod: b.timePeriod,
          content: b.content
        }))),
        frequencyData: JSON.stringify({ recentAbnormalCount: recentBehaviors.length }),
        timeRange: new Date(now.getTime() - 60 * 60 * 1000).toISOString() + ' ~ ' + now.toISOString(),
        contentCompliance: reason,
        intercepted: 1,
        operatorId: operator?.userId,
        operatorName: operator?.username,
        autoHandled: operator ? 0 : 1,
        handleResult: reason
      } as any, { transaction: t })

      await user.update({
        punishmentStatus: PunishmentStatus.ACTIVE,
        lastViolationTime: now,
        violationCount: (user.violationCount ?? 0) + 1
      }, { transaction: t })

      await t.commit()
      return { success: true, logId: log.id }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async applyPunishment(
    userId: number,
    riskLevel: number,
    violationType: string,
    operator?: OperatorInfo
  ): Promise<{
    success: boolean
    punishments: Array<{
      type: string
      typeName: string
      duration: number
    }>
  }> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const punishmentTypes = RISK_PUNISHMENT_MAP[riskLevel]
    if (!punishmentTypes || punishmentTypes.length === 0) {
      return { success: true, punishments: [] }
    }

    const now = new Date()
    const results: Array<{ type: string; typeName: string; duration: number }> = []
    const t = await sequelize.transaction()

    try {
      const riskControlLog = await RiskControlLog.create({
        userId,
        userName: user.username,
        violationType,
        riskLevel,
        behaviorDetail: JSON.stringify({ violationType, riskLevel }),
        intercepted: 1,
        operatorId: operator?.userId,
        operatorName: operator?.username,
        autoHandled: operator ? 0 : 1,
        handleResult: `自动联动处罚：${RISK_LEVEL_NAMES[riskLevel]}风险`
      } as any, { transaction: t })

      for (const pt of punishmentTypes) {
        const duration = PUNISHMENT_DURATIONS[pt] || 0
        const startTime = now
        const endTime = duration > 0 ? new Date(now.getTime() + duration * 60 * 1000) : null

        await PunishmentRecord.create({
          userId,
          userName: user.username,
          punishmentType: pt,
          riskLevel,
          violationType,
          reason: `${RISK_LEVEL_NAMES[riskLevel]}风险自动联动处罚`,
          reasonDetail: `违规类型：${VIOLATION_TYPE_NAMES[violationType] || violationType}，风险等级：${RISK_LEVEL_NAMES[riskLevel]}`,
          status: PunishmentStatus.ACTIVE,
          startTime,
          endTime,
          duration,
          operatorId: operator?.userId,
          operatorName: operator?.username,
          riskControlLogId: riskControlLog.id
        } as any, { transaction: t })

        results.push({
          type: pt,
          typeName: PUNISHMENT_TYPE_NAMES[pt],
          duration
        })
      }

      let maxEndTime: Date | null = null
      for (const pt of punishmentTypes) {
        const duration = PUNISHMENT_DURATIONS[pt] || 0
        if (duration > 0) {
          const end = new Date(now.getTime() + duration * 60 * 1000)
          if (!maxEndTime || end > maxEndTime) maxEndTime = end
        }
      }

      const isBanned = punishmentTypes.includes(PunishmentType.TEMP_BAN) ||
        punishmentTypes.includes(PunishmentType.PERMANENT_BAN)
      const isFlowLimited = punishmentTypes.includes(PunishmentType.FLOW_LIMIT)

      await user.update({
        riskLevel: Math.max(user.riskLevel ?? 0, riskLevel),
        punishmentStatus: PunishmentStatus.ACTIVE,
        punishmentExpireTime: maxEndTime,
        banExpireTime: isBanned ? (punishmentTypes.includes(PunishmentType.PERMANENT_BAN) ? null : maxEndTime) : user.banExpireTime,
        isPermanentBanned: punishmentTypes.includes(PunishmentType.PERMANENT_BAN) ? 1 : user.isPermanentBanned,
        flowLimitExpireTime: isFlowLimited ? maxEndTime : user.flowLimitExpireTime,
        lastViolationTime: now,
        violationCount: (user.violationCount ?? 0) + 1
      }, { transaction: t })

      await t.commit()
      return { success: true, punishments: results }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async getPunishmentList(params: PunishmentListQueryParams): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
  }> {
    const { page, pageSize, userId, punishmentType, riskLevel, status, startTime, endTime } = params

    const where: any = {}
    if (userId !== undefined) where.userId = userId
    if (punishmentType) where.punishmentType = punishmentType
    if (riskLevel !== undefined) where.riskLevel = riskLevel
    if (status !== undefined) where.status = status
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: new Date(startTime) }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: new Date(endTime) }

    const { count, rows } = await PunishmentRecord.findAndCountAll({
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

    return { list: rows, total: count, page, pageSize }
  },

  async updatePunishmentStatus(
    recordId: number,
    status: number,
    operator: OperatorInfo,
    revokeReason?: string
  ): Promise<{
    success: boolean
    oldStatus: number
    newStatus: number
  }> {
    const record = await PunishmentRecord.findByPk(recordId)
    if (!record) {
      throw new AppError('处罚记录不存在', 404)
    }

    const oldStatus = record.status as number
    const now = new Date()

    if (status === PunishmentStatus.EXPIRED) {
      if (record.endTime && record.endTime > now) {
        throw new AppError('处罚尚未到期，无法标记为过期', 400)
      }
    }

    if (status === PunishmentStatus.REVOKED && !revokeReason) {
      throw new AppError('解除处罚需提供原因', 400)
    }

    const updates: any = { status }
    if (status === PunishmentStatus.REVOKED) {
      updates.revokeOperatorId = operator.userId
      updates.revokeOperatorName = operator.username
      updates.revokeTime = now
      updates.revokeReason = revokeReason
    }

    const t = await sequelize.transaction()
    try {
      await record.update(updates, { transaction: t })

      if (status === PunishmentStatus.REVOKED || status === PunishmentStatus.EXPIRED) {
        const activeCount = await PunishmentRecord.count({
          where: {
            userId: record.userId,
            status: PunishmentStatus.ACTIVE
          },
          transaction: t
        })

        if (activeCount === 0) {
          await User.update(
            {
              punishmentStatus: PunishmentStatus.EXPIRED,
              punishmentExpireTime: now,
              banExpireTime: null,
              isPermanentBanned: 0,
              flowLimitExpireTime: null
            },
            {
              where: { id: record.userId },
              transaction: t
            }
          )
        }
      }

      await t.commit()
      return { success: true, oldStatus, newStatus: status }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async revokePunishment(
    recordId: number,
    reason: string,
    operator: OperatorInfo
  ): Promise<{
    success: boolean
    message: string
  }> {
    const result = await this.updatePunishmentStatus(recordId, PunishmentStatus.REVOKED, operator, reason)
    return { success: result.success, message: '处罚已解除' }
  },

  async getUserRiskDetail(userId: number): Promise<{
    user: {
      id: number
      username: string
      nickname: string
      avatar: string
      riskLevel: number
      riskLevelName: string
      riskScore: number
      punishmentStatus: number
      punishmentStatusName: string
      punishmentExpireTime: Date | null
      lastViolationTime: Date | null
      violationCount: number
    }
    activePunishments: any[]
    recentRiskLogs: any[]
  }> {
    return this.getUserRiskStatus(userId)
  },

  async getUserRiskStatus(userId: number): Promise<{
    user: {
      id: number
      username: string
      nickname: string
      avatar: string
      riskLevel: number
      riskLevelName: string
      riskScore: number
      punishmentStatus: number
      punishmentStatusName: string
      punishmentExpireTime: Date | null
      lastViolationTime: Date | null
      violationCount: number
    }
    activePunishments: any[]
    recentRiskLogs: any[]
  }> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const [activePunishments, recentRiskLogs] = await Promise.all([
      PunishmentRecord.findAll({
        where: { userId, status: PunishmentStatus.ACTIVE },
        order: [['createTime', 'DESC']]
      }),
      RiskControlLog.findAll({
        where: { userId },
        order: [['createTime', 'DESC']],
        limit: 10
      })
    ])

    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        riskLevel: user.riskLevel ?? 0,
        riskLevelName: RISK_LEVEL_NAMES[user.riskLevel ?? 0],
        riskScore: user.riskScore ?? 0,
        punishmentStatus: user.punishmentStatus ?? 0,
        punishmentStatusName: PUNISHMENT_STATUS_NAMES[user.punishmentStatus ?? 0],
        punishmentExpireTime: user.punishmentExpireTime,
        lastViolationTime: user.lastViolationTime,
        violationCount: user.violationCount ?? 0
      },
      activePunishments,
      recentRiskLogs
    }
  },

  async batchHandlePunishment(
    params: BatchHandleParams,
    operator: OperatorInfo
  ): Promise<{
    total: number
    success: number
    fail: number
    results: Array<{
      userId: number
      success: boolean
      error?: string
    }>
  }> {
    const permCheck = await this.checkPermission(operator, 'batch_handle')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const { userIds, action, reason } = params
    if (userIds.length === 0) {
      return { total: 0, success: 0, fail: 0, results: [] }
    }

    const results: Array<{ userId: number; success: boolean; error?: string }> = []
    let successCount = 0
    let failCount = 0

    for (const userId of userIds) {
      try {
        if (action === 'release_minor') {
          const minorRecords = await PunishmentRecord.findAll({
            where: {
              userId,
              riskLevel: RiskLevel.LOW,
              status: PunishmentStatus.ACTIVE
            }
          })

          for (const record of minorRecords) {
            await record.update({
              status: PunishmentStatus.REVOKED,
              revokeOperatorId: operator.userId,
              revokeOperatorName: operator.username,
              revokeTime: new Date(),
              revokeReason: reason
            })
          }

          const remainingActive = await PunishmentRecord.count({
            where: { userId, status: PunishmentStatus.ACTIVE }
          })

          if (remainingActive === 0) {
            await User.update(
              {
                punishmentStatus: PunishmentStatus.EXPIRED,
                punishmentExpireTime: new Date(),
                riskLevel: RiskLevel.NONE,
                riskScore: 0
              },
              { where: { id: userId } }
            )
          }

          successCount++
          results.push({ userId, success: true })
        } else if (action === 'ban_severe') {
          await this.applyPunishment(userId, RiskLevel.HIGH, ViolationType.SPAM, operator)
          successCount++
          results.push({ userId, success: true })
        }
      } catch (error: any) {
        failCount++
        results.push({ userId, success: false, error: error.message })
      }

      if (userIds.indexOf(userId) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    return {
      total: userIds.length,
      success: successCount,
      fail: failCount,
      results
    }
  },

  async checkPermission(operator: OperatorInfo, operation: string): Promise<{ allowed: boolean; reason?: string }> {
    const permissionMap: Record<string, { roles: string[] }> = {
      view: { roles: ['admin', 'risk_admin', 'operator'] },
      handle: { roles: ['admin', 'risk_admin'] },
      batch_handle: { roles: ['admin', 'risk_admin'] },
      intercept: { roles: ['admin', 'risk_admin'] },
      revoke: { roles: ['admin'] }
    }

    const perm = permissionMap[operation]
    if (!perm) {
      return { allowed: false, reason: '无效的操作类型' }
    }

    const hasRole = operator.roles.some(role => perm.roles.includes(role))
    if (!hasRole) {
      const roleNames: Record<string, string> = {
        admin: '管理员',
        risk_admin: '风控管理员',
        operator: '运营'
      }
      const requiredRoles = perm.roles.map(r => roleNames[r]).join('或')
      return { allowed: false, reason: `无权限执行${operation}，需要${requiredRoles}角色` }
    }

    return { allowed: true }
  },

  async getViolationTrace(userId: number): Promise<{
    user: any
    behaviorLogs: any[]
    riskControlLogs: any[]
    punishmentRecords: any[]
    rectificationRecords: any[]
  }> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const [behaviorLogs, riskControlLogs, punishmentRecords] = await Promise.all([
      BehaviorLog.findAll({
        where: { userId, isAbnormal: 1 },
        order: [['createTime', 'DESC']],
        limit: 100
      }),
      RiskControlLog.findAll({
        where: { userId },
        order: [['createTime', 'DESC']],
        limit: 50
      }),
      PunishmentRecord.findAll({
        where: { userId },
        order: [['createTime', 'DESC']],
        limit: 50
      })
    ])

    const rectificationRecords = punishmentRecords.filter(
      (r: any) => r.rectificationResult
    )

    return {
      user,
      behaviorLogs,
      riskControlLogs,
      punishmentRecords,
      rectificationRecords
    }
  },

  async validatePunishment(recordId: number): Promise<{
    valid: boolean
    issues: string[]
    warnings: string[]
  }> {
    const record = await PunishmentRecord.findByPk(recordId)
    if (!record) {
      throw new AppError('处罚记录不存在', 404)
    }

    const issues: string[] = []
    const warnings: string[] = []

    const duplicateRecords = await PunishmentRecord.findAll({
      where: {
        userId: record.userId,
        violationType: record.violationType,
        status: PunishmentStatus.ACTIVE,
        id: { [Op.ne]: recordId }
      }
    })

    if (duplicateRecords.length > 0) {
      issues.push('存在同类违规的重复处罚')
      await record.update({ isDuplicate: 1 })
    }

    const expectedTypes = RISK_PUNISHMENT_MAP[record.riskLevel] || []
    if (!expectedTypes.includes(record.punishmentType)) {
      const isExcessive = record.riskLevel === RiskLevel.LOW && (
        record.punishmentType === PunishmentType.TEMP_BAN ||
        record.punishmentType === PunishmentType.PERMANENT_BAN
      )
      if (isExcessive) {
        issues.push('处罚力度超出风险等级对应范围，存在过度处罚')
        await record.update({ isExcessive: 1 })
      } else {
        warnings.push('处罚类型不在风险等级标准映射范围内')
      }
    }

    const recentPunishments = await PunishmentRecord.count({
      where: {
        userId: record.userId,
        status: { [Op.in]: [PunishmentStatus.ACTIVE, PunishmentStatus.EXPIRED] },
        createTime: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    if (recentPunishments >= 3) {
      warnings.push('7天内存在3次以上处罚，建议复核用户行为')
    }

    const user = await User.findByPk(record.userId)
    if (user && user.violationCount === 0) {
      warnings.push('用户违规次数为0但存在处罚记录，数据可能不一致')
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    }
  },

  async generateReviewReport(userId: number): Promise<{
    user: any
    summary: {
      totalViolations: number
      totalPunishments: number
      activePunishments: number
      riskTrend: string
    }
    behaviorAnalysis: {
      topViolationTypes: Array<{ type: string; typeName: string; count: number }>
      timeDistribution: Record<string, number>
    }
    punishmentAnalysis: {
      byType: Array<{ type: string; typeName: string; count: number }>
      byRiskLevel: Record<string, number>
      avgDuration: number
    }
    suggestions: string[]
  }> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [behaviorLogs, riskControlLogs, punishmentRecords] = await Promise.all([
      BehaviorLog.findAll({
        where: { userId, isAbnormal: 1, createTime: { [Op.gte]: thirtyDaysAgo } }
      }),
      RiskControlLog.findAll({
        where: { userId, createTime: { [Op.gte]: thirtyDaysAgo } }
      }),
      PunishmentRecord.findAll({
        where: { userId }
      })
    ])

    const violationTypeCount: Record<string, number> = {}
    behaviorLogs.forEach((log: any) => {
      const type = log.abnormalType || 'unknown'
      violationTypeCount[type] = (violationTypeCount[type] || 0) + 1
    })
    const topViolationTypes = Object.entries(violationTypeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({
        type,
        typeName: VIOLATION_TYPE_NAMES[type] || type,
        count
      }))

    const timeDistribution: Record<string, number> = {}
    behaviorLogs.forEach((log: any) => {
      const period = log.timePeriod || 'unknown'
      timeDistribution[period] = (timeDistribution[period] || 0) + 1
    })

    const punishmentByType: Record<string, number> = {}
    const punishmentByRiskLevel: Record<string, number> = {}
    let totalDuration = 0
    let durationCount = 0

    punishmentRecords.forEach((r: any) => {
      punishmentByType[r.punishmentType] = (punishmentByType[r.punishmentType] || 0) + 1
      const rl = String(r.riskLevel)
      punishmentByRiskLevel[rl] = (punishmentByRiskLevel[rl] || 0) + 1
      if (r.duration && r.duration > 0) {
        totalDuration += r.duration
        durationCount++
      }
    })

    const byType = Object.entries(punishmentByType).map(([type, count]) => ({
      type,
      typeName: PUNISHMENT_TYPE_NAMES[type] || type,
      count
    }))

    const activePunishments = punishmentRecords.filter((r: any) => r.status === PunishmentStatus.ACTIVE)

    let riskTrend = 'stable'
    if (riskControlLogs.length > 5) {
      riskTrend = 'increasing'
    } else if (riskControlLogs.length === 0) {
      riskTrend = 'improving'
    }

    const suggestions: string[] = []
    if (user.riskLevel === RiskLevel.HIGH) {
      suggestions.push('用户处于高风险等级，建议加强监控频次')
    }
    if (activePunishments.length > 2) {
      suggestions.push('存在多个生效处罚，建议评估是否需要升级处罚力度')
    }
    if (topViolationTypes.some(v => v.type === ViolationType.MALICIOUS_TRAFFIC)) {
      suggestions.push('存在恶意引流行为，建议检查发布内容并限制私信功能')
    }
    if (topViolationTypes.some(v => v.type === ViolationType.SPAM)) {
      suggestions.push('存在刷屏行为，建议设置发布频率限制')
    }
    if (user.violationCount > 10) {
      suggestions.push('累计违规次数较多，建议考虑永久封禁')
    }
    if (suggestions.length === 0) {
      suggestions.push('用户行为表现良好，建议维持当前风控策略')
    }

    const report = {
      user,
      summary: {
        totalViolations: behaviorLogs.length,
        totalPunishments: punishmentRecords.length,
        activePunishments: activePunishments.length,
        riskTrend
      },
      behaviorAnalysis: {
        topViolationTypes,
        timeDistribution
      },
      punishmentAnalysis: {
        byType,
        byRiskLevel: punishmentByRiskLevel,
        avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0
      },
      suggestions
    }

    if (activePunishments.length > 0) {
      await PunishmentRecord.update(
        { reviewReport: JSON.stringify(report) },
        { where: { userId, status: PunishmentStatus.ACTIVE } }
      )
    }

    return report
  }
}
