import {
  Activity,
  ActivityParticipation,
  ActivityParticipationAuditLog,
  User,
  PunishmentRecord
} from '@/models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import sequelize from '@config/database'
import {
  ParticipationStatus,
  PARTICIPATION_STATUS_NAMES,
  PARTICIPATION_STATUS_COLORS,
  ParticipationCheckDimension,
  PARTICIPATION_CHECK_DIMENSION_NAMES,
  CheckResultLevel,
  CHECK_RESULT_LEVEL_NAMES,
  ParticipationViolationType,
  PARTICIPATION_VIOLATION_TYPE_NAMES,
  ParticipationAuditAction,
  PARTICIPATION_AUDIT_ACTION_NAMES,
  TaskCompletionStatus,
  TASK_COMPLETION_STATUS_NAMES,
  PARTICIPATION_ANTI_FRAUD_RULES,
  CampaignStatus,
  PunishmentStatus
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

interface ParticipantSnapshot {
  userId: number
  username: string
  nickname: string
  userLevel: number
  activityLevel: number
  riskLevel: number
  riskScore: number
  realNameVerified: number
  phoneVerified: number
  status: number
  isAbnormal: number
  punishmentStatus: number
  punishmentExpireTime: string | null
  banExpireTime: string | null
  flowLimitExpireTime: string | null
  violationCount: number
}

const safeJSONParse = <T>(str: any, defaultValue: T): T => {
  if (!str) return defaultValue
  if (typeof str === 'object') return str as T
  try {
    return JSON.parse(str) as T
  } catch {
    return defaultValue
  }
}

const genBatchId = (): string => {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `BATCH_PART_${ts}_${rand}`
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

const participationSnapshot = (p: ActivityParticipation): Record<string, any> => {
  return {
    id: p.id,
    activityId: p.activityId,
    activityName: p.activityName,
    userId: p.userId,
    username: p.username,
    nickname: p.nickname,
    status: p.status,
    signUpTime: p.signUpTime,
    taskStatus: p.taskStatus,
    taskSubmitTime: p.taskSubmitTime,
    taskVerifyTime: p.taskVerifyTime,
    rewardStatus: p.rewardStatus,
    rewardGrantTime: p.rewardGrantTime,
    checkDimension: p.checkDimension,
    checkLevel: p.checkLevel,
    checkMessage: p.checkMessage,
    violationType: p.violationType,
    isAnomaly: p.isAnomaly,
    anomalyType: p.anomalyType,
    anomalyReason: p.anomalyReason,
    riskScore: p.riskScore,
    riskLevel: p.riskLevel,
    remark: p.remark,
    operatorId: p.operatorId,
    operatorName: p.operatorName,
    batchId: p.batchId
  }
}

const decorateParticipation = (p: ActivityParticipation): any => {
  const data = (p as any).toJSON ? (p as any).toJSON() : { ...p }
  data.statusName = PARTICIPATION_STATUS_NAMES[data.status ?? ParticipationStatus.PENDING_PARTICIPATE] ?? ''
  data.statusColor = PARTICIPATION_STATUS_COLORS[data.status ?? ParticipationStatus.PENDING_PARTICIPATE] ?? ''
  data.taskStatusName = TASK_COMPLETION_STATUS_NAMES[data.taskStatus ?? TaskCompletionStatus.NOT_STARTED] ?? ''
  data.checkDimensionName = data.checkDimension ? PARTICIPATION_CHECK_DIMENSION_NAMES[data.checkDimension] ?? '' : ''
  data.checkLevelName = data.checkLevel ? CHECK_RESULT_LEVEL_NAMES[data.checkLevel] ?? '' : ''
  data.violationTypeName = data.violationType ? PARTICIPATION_VIOLATION_TYPE_NAMES[data.violationType] ?? '' : ''
  data.participantSnapshot = safeJSONParse(data.participantSnapshot, null)
  data.taskDetail = safeJSONParse(data.taskDetail, null)
  data.rewardDetail = safeJSONParse(data.rewardDetail, null)
  data.violationDetail = safeJSONParse(data.violationDetail, null)
  return data
}

class ActivityParticipationService {
  // ==================== 内部工具：写入审计日志 ====================
  private async _writeAudit(params: {
    participationId: number
    activityId: number
    activityName: string
    userId: number
    username: string
    action: ParticipationAuditAction
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
    await ActivityParticipationAuditLog.create({
      participationId: params.participationId,
      activityId: params.activityId,
      activityName: params.activityName,
      userId: params.userId,
      username: params.username,
      action: params.action,
      actionName: PARTICIPATION_AUDIT_ACTION_NAMES[params.action] ?? '',
      operatorId: params.operator?.userId,
      operatorName: params.operator?.username,
      oldData: params.oldData ? JSON.stringify(params.oldData) : null,
      newData: params.newData ? JSON.stringify(params.newData) : null,
      changedFields: params.changedFields ? JSON.stringify(params.changedFields) : null,
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

  // ==================== 内部工具：校验用户是否有生效中处罚 ====================
  private async _hasActivePunishment(userId: number): Promise<{ active: boolean; detail?: any }> {
    const now = new Date()
    const rec = await PunishmentRecord.findOne({
      where: {
        userId,
        status: PunishmentStatus.ACTIVE,
        [Op.or]: [
          { endTime: { [Op.is]: null } as any },
          { endTime: { [Op.gt]: now } }
        ]
      } as any,
      order: [['createTime', 'DESC']]
    })
    if (!rec) return { active: false }
    return { active: true, detail: rec }
  }

  // ==================== 内部工具：单活动参与次数统计 ====================
  private async _countParticipationsInActivity(activityId: number, userId: number): Promise<number> {
    return await ActivityParticipation.count({
      where: {
        activityId,
        userId,
        status: { [Op.ne]: ParticipationStatus.CANCELLED }
      }
    })
  }

  // ==================== 内部工具：全局参与频率（近1小时） ====================
  private async _countRecentParticipations(userId: number): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return await ActivityParticipation.count({
      where: {
        userId,
        createTime: { [Op.gte]: oneHourAgo }
      }
    })
  }

  // ==================== 内部工具：同设备/同IP参与数 ====================
  private async _countSameDeviceParticipations(activityId: number, deviceId?: string, ip?: string): Promise<{ deviceCount: number; ipCount: number }> {
    let deviceCount = 0
    let ipCount = 0
    if (deviceId) {
      deviceCount = await ActivityParticipation.count({ where: { activityId, deviceId } })
    }
    if (ip) {
      ipCount = await ActivityParticipation.count({ where: { activityId, ip } })
    }
    return { deviceCount, ipCount }
  }

  // ==================== 内部工具：刷参与模式检测（短时间高频参与） ====================
  private async _detectBrushPattern(userId: number): Promise<boolean> {
    const windowMs = PARTICIPATION_ANTI_FRAUD_RULES.BRUSH_PATTERN_WINDOW_MINUTES * 60 * 1000
    const threshold = PARTICIPATION_ANTI_FRAUD_RULES.BRUSH_PATTERN_THRESHOLD
    const windowStart = new Date(Date.now() - windowMs)
    const count = await ActivityParticipation.count({
      where: { userId, createTime: { [Op.gte]: windowStart } }
    })
    return count >= threshold
  }

  // ==================== 功能点1：前置校验参与资格（多维度全量校验） ====================
  async validateParticipationEligibility(
    activityId: number,
    userId: number,
    clientInfo: { deviceId?: string; ip?: string; userAgent?: string } = {}
  ): Promise<{
    eligible: boolean
    passed: boolean
    hasBlocker: boolean
    hasError: boolean
    results: CheckResultItem[]
    fieldErrors: Record<string, string>
    userSnapshot?: ParticipantSnapshot
    activitySnapshot?: any
  }> {
    const results: CheckResultItem[] = []
    const fieldErrors: Record<string, string> = {}
    let hasBlocker = false
    let hasError = false

    const [activity, user] = await Promise.all([
      Activity.findByPk(activityId),
      User.findByPk(userId)
    ])

    if (!activity) {
      results.push({
        dimension: ParticipationCheckDimension.ACTIVITY_TIME,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.ACTIVITY_TIME],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '活动不存在',
        field: 'activityId'
      })
      return { eligible: false, passed: false, hasBlocker: true, hasError: false, results, fieldErrors }
    }
    if (!user) {
      results.push({
        dimension: ParticipationCheckDimension.ACCOUNT_STATUS,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.ACCOUNT_STATUS],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '用户账号不存在',
        field: 'userId'
      })
      return { eligible: false, passed: false, hasBlocker: true, hasError: false, results, fieldErrors }
    }

    const userSnapshot: ParticipantSnapshot = {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      userLevel: user.userLevel,
      activityLevel: user.activityLevel,
      riskLevel: user.riskLevel,
      riskScore: user.riskScore,
      realNameVerified: user.realNameVerified,
      phoneVerified: user.phoneVerified,
      status: user.status,
      isAbnormal: user.isAbnormal,
      punishmentStatus: user.punishmentStatus,
      punishmentExpireTime: user.punishmentExpireTime ? user.punishmentExpireTime.toISOString() : null,
      banExpireTime: user.banExpireTime ? user.banExpireTime.toISOString() : null,
      flowLimitExpireTime: user.flowLimitExpireTime ? user.flowLimitExpireTime.toISOString() : null,
      violationCount: user.violationCount
    }

    // 1. 活动状态和时段
    if (activity.status !== CampaignStatus.ONLINE) {
      results.push({
        dimension: ParticipationCheckDimension.ACTIVITY_TIME,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.ACTIVITY_TIME],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '活动尚未上线或已下线',
        field: 'activity.status'
      })
      hasBlocker = true
    }
    const now = new Date()
    if (activity.startTime && now < new Date(activity.startTime)) {
      results.push({
        dimension: ParticipationCheckDimension.ACTIVITY_TIME,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.ACTIVITY_TIME],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '活动尚未开始',
        field: 'activity.startTime'
      })
      hasBlocker = true
    }
    if (activity.endTime && now > new Date(activity.endTime)) {
      results.push({
        dimension: ParticipationCheckDimension.ACTIVITY_TIME,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.ACTIVITY_TIME],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '活动已结束',
        field: 'activity.endTime'
      })
      hasBlocker = true
    }

    // 2. 账号状态
    if (user.status !== 1) {
      results.push({
        dimension: ParticipationCheckDimension.ACCOUNT_STATUS,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.ACCOUNT_STATUS],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '账号已被禁用',
        field: 'user.status'
      })
      fieldErrors['account'] = '账号已被禁用，无法参与活动'
      hasBlocker = true
    }
    if (user.isPermanentBanned === 1) {
      results.push({
        dimension: ParticipationCheckDimension.ACCOUNT_STATUS,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.ACCOUNT_STATUS],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '账号已被永久封禁',
        field: 'user.isPermanentBanned'
      })
      fieldErrors['account'] = '账号已被永久封禁'
      hasBlocker = true
    }

    // 3. 生效中处罚
    if (user.banExpireTime && new Date(user.banExpireTime) > now) {
      results.push({
        dimension: ParticipationCheckDimension.PUNISHMENT_ACTIVE,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.PUNISHMENT_ACTIVE],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '账号处于封禁期，解封前无法参与',
        field: 'user.banExpireTime'
      })
      fieldErrors['punishment'] = '账号处于封禁期'
      hasBlocker = true
    }
    const punishmentCheck = await this._hasActivePunishment(userId)
    if (punishmentCheck.active) {
      results.push({
        dimension: ParticipationCheckDimension.PUNISHMENT_ACTIVE,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.PUNISHMENT_ACTIVE],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `当前存在生效处罚：${punishmentCheck.detail?.reason || '违规限制'}`,
        field: 'punishment'
      })
      fieldErrors['punishment'] = '账号存在生效处罚'
      hasBlocker = true
    }

    // 4. 限流
    if (user.flowLimitExpireTime && new Date(user.flowLimitExpireTime) > now) {
      results.push({
        dimension: ParticipationCheckDimension.FLOW_LIMIT,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.FLOW_LIMIT],
        level: CheckResultLevel.ERROR,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
        message: '账号处于限流保护期',
        field: 'user.flowLimitExpireTime'
      })
      fieldErrors['flowLimit'] = '账号处于限流期'
      hasError = true
    }

    // 5. 活动参与门槛配置
    const participantThreshold = Number(activity.participantThreshold) || 0
    const scopeConfig = safeJSONParse<Record<string, any>>(activity.participantScopeConfig, {})

    // 5.1 实名认证
    if (scopeConfig.requireRealName && user.realNameVerified !== 2) {
      results.push({
        dimension: ParticipationCheckDimension.REAL_NAME,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.REAL_NAME],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '活动要求实名认证后参与',
        field: 'user.realNameVerified',
        suggestion: '请先完成实名认证'
      })
      fieldErrors['realName'] = '需完成实名认证'
      hasBlocker = true
    }
    // 5.2 手机号
    if (scopeConfig.requirePhone && user.phoneVerified !== 1) {
      results.push({
        dimension: ParticipationCheckDimension.PHONE_VERIFIED,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.PHONE_VERIFIED],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '活动要求绑定手机号后参与',
        field: 'user.phoneVerified',
        suggestion: '请先绑定手机号'
      })
      fieldErrors['phone'] = '需绑定手机号'
      hasBlocker = true
    }
    // 5.3 用户等级
    const minLevel = scopeConfig.minUserLevel ?? participantThreshold
    if (minLevel > 0 && user.userLevel < minLevel) {
      results.push({
        dimension: ParticipationCheckDimension.USER_LEVEL,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.USER_LEVEL],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `用户等级不满足（要求${minLevel}级，当前${user.userLevel}级）`,
        field: 'user.userLevel'
      })
      fieldErrors['level'] = '用户等级不足'
      hasBlocker = true
    }
    // 5.4 活跃度
    const minActivityLevel = scopeConfig.minActivityLevel
    if (minActivityLevel !== undefined && user.activityLevel < minActivityLevel) {
      results.push({
        dimension: ParticipationCheckDimension.ACTIVITY_LEVEL,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.ACTIVITY_LEVEL],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `活跃度不满足（要求${minActivityLevel}级，当前${user.activityLevel}级）`,
        field: 'user.activityLevel'
      })
      fieldErrors['activityLevel'] = '活跃度不足'
      hasBlocker = true
    }
    // 5.5 风险等级
    const maxRiskLevel = scopeConfig.maxRiskLevel
    if (maxRiskLevel !== undefined && user.riskLevel > maxRiskLevel) {
      results.push({
        dimension: ParticipationCheckDimension.RISK_LEVEL,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.RISK_LEVEL],
        level: CheckResultLevel.ERROR,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
        message: `风险等级过高（要求≤${maxRiskLevel}，当前${user.riskLevel}级）`,
        field: 'user.riskLevel'
      })
      fieldErrors['risk'] = '风险等级过高'
      hasError = true
    }

    // 6. 单活动参与次数限制
    const maxPerActivity = scopeConfig.maxParticipationsPerUser ?? PARTICIPATION_ANTI_FRAUD_RULES.SINGLE_ACTIVITY_MAX_PER_USER
    const currentCount = await this._countParticipationsInActivity(activityId, userId)
    if (currentCount >= maxPerActivity) {
      results.push({
        dimension: ParticipationCheckDimension.PARTICIPATION_COUNT,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.PARTICIPATION_COUNT],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: `已达本活动最大参与次数（${currentCount}/${maxPerActivity}）`,
        field: 'participationCount'
      })
      fieldErrors['count'] = '参与次数已达上限'
      hasBlocker = true
    }

    // 7. 全局参与频率
    const globalCount = await this._countRecentParticipations(userId)
    if (globalCount >= PARTICIPATION_ANTI_FRAUD_RULES.GLOBAL_PARTICIPATIONS_PER_HOUR) {
      results.push({
        dimension: ParticipationCheckDimension.GLOBAL_FREQUENCY,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.GLOBAL_FREQUENCY],
        level: CheckResultLevel.WARNING,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
        message: `近1小时参与${globalCount}次，频率较高`
      })
      hasError = true
    }

    // 8. 反作弊 - 同设备/同IP
    if (clientInfo.deviceId || clientInfo.ip) {
      const { deviceCount, ipCount } = await this._countSameDeviceParticipations(
        activityId,
        clientInfo.deviceId,
        clientInfo.ip
      )
      if (clientInfo.deviceId && deviceCount >= PARTICIPATION_ANTI_FRAUD_RULES.SAME_DEVICE_MAX_PARTICIPATIONS) {
        results.push({
          dimension: ParticipationCheckDimension.SAME_DEVICE,
          dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.SAME_DEVICE],
          level: CheckResultLevel.BLOCKER,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
          message: `该设备已参与${deviceCount}次，超过同设备参与限制`
        })
        hasBlocker = true
      }
      if (clientInfo.ip && ipCount >= PARTICIPATION_ANTI_FRAUD_RULES.SAME_IP_MAX_PARTICIPATIONS) {
        results.push({
          dimension: ParticipationCheckDimension.SAME_IP,
          dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.SAME_IP],
          level: CheckResultLevel.WARNING,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
          message: `该IP已参与${ipCount}次，频率偏高`
        })
        hasError = true
      }
    }

    // 9. 刷参与模式检测
    const isBrushPattern = await this._detectBrushPattern(userId)
    if (isBrushPattern) {
      results.push({
        dimension: ParticipationCheckDimension.SUSPICIOUS_PATTERN,
        dimensionName: PARTICIPATION_CHECK_DIMENSION_NAMES[ParticipationCheckDimension.SUSPICIOUS_PATTERN],
        level: CheckResultLevel.BLOCKER,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
        message: '检测到异常参与行为模式，已临时拦截'
      })
      hasBlocker = true
    }

    const passed = !hasBlocker && !hasError
    const eligible = !hasBlocker

    const activitySnapshot = {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      status: activity.status,
      startTime: activity.startTime,
      endTime: activity.endTime,
      participantThreshold: activity.participantThreshold,
      participantScopeType: activity.participantScopeType,
      participantScopeConfig: safeJSONParse(activity.participantScopeConfig, {})
    }

    return { eligible, passed, hasBlocker, hasError, results, fieldErrors, userSnapshot, activitySnapshot }
  }

  // ==================== 功能点2：用户报名 ====================
  async signUp(
    activityId: number,
    userId: number,
    clientInfo: { deviceId?: string; ip?: string; userAgent?: string } = {},
    operator?: OperatorInfo
  ) {
    // Step 1: 前置校验
    const validation = await this.validateParticipationEligibility(activityId, userId, clientInfo)
    const blocker = validation.results.find(r => r.level === CheckResultLevel.BLOCKER)
    if (!validation.eligible && blocker) {
      // 写拦截审计（即使没有 participationId 也记录）
      const activity = validation.activitySnapshot
      const user = validation.userSnapshot
      await this._writeAudit({
        participationId: 0,
        activityId,
        activityName: activity?.name || '',
        userId,
        username: user?.username || '',
        action: ParticipationAuditAction.SIGNUP_BLOCKED,
        operator,
        checkDimension: blocker.dimension,
        checkLevel: blocker.level,
        checkMessage: blocker.message
      })
      const err: any = new AppError(`报名被拦截：${blocker.message}`, 422)
      err.dimension = blocker.dimension
      err.fieldErrors = validation.fieldErrors
      err.validation = validation
      throw err
    }

    const activity = validation.activitySnapshot!
    const user = validation.userSnapshot!

    const t = await sequelize.transaction()
    try {
      const now = new Date()
      const rec = await ActivityParticipation.create({
        activityId,
        activityName: activity.name,
        userId,
        username: user.username,
        nickname: user.nickname,
        status: validation.passed ? ParticipationStatus.PENDING_PARTICIPATE : ParticipationStatus.UNDER_REVIEW,
        signUpTime: now,
        taskStatus: TaskCompletionStatus.NOT_STARTED,
        rewardStatus: 0,
        participantSnapshot: JSON.stringify(user),
        checkDimension: validation.hasError ? validation.results.find(r => r.level === CheckResultLevel.ERROR || r.level === CheckResultLevel.WARNING)?.dimension || '' : '',
        checkLevel: validation.hasError ? (validation.results.find(r => r.level === CheckResultLevel.ERROR)?.level || CheckResultLevel.WARNING) : CheckResultLevel.PASS,
        checkMessage: validation.hasError ? validation.results.find(r => r.level === CheckResultLevel.ERROR || r.level === CheckResultLevel.WARNING)?.message || '' : '',
        deviceId: clientInfo.deviceId || '',
        ip: clientInfo.ip || '',
        userAgent: clientInfo.userAgent || '',
        riskScore: user.riskScore,
        riskLevel: user.riskLevel,
        isAnomaly: 0,
        operatorId: operator?.userId,
        operatorName: operator?.username,
        createTime: now,
        updateTime: now
      } as any, { transaction: t } as any) as unknown as ActivityParticipation

      // 同步活动参与数
      await Activity.increment('participantCount', { by: 1, where: { id: activityId }, transaction: t })

      await t.commit()

      // 写入审计
      await this._writeAudit({
        participationId: rec.id,
        activityId,
        activityName: activity.name,
        userId,
        username: user.username,
        action: validation.passed ? ParticipationAuditAction.SIGNED_UP : ParticipationAuditAction.MANUAL_APPROVED,
        operator,
        newData: participationSnapshot(rec),
        changedFields: ['status', 'signUpTime'],
        remark: validation.passed ? '用户自主报名成功' : '报名进入待审核状态'
      })

      return {
        id: rec.id,
        status: rec.status,
        statusName: PARTICIPATION_STATUS_NAMES[rec.status],
        signUpTime: rec.signUpTime,
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

  // ==================== 功能点2：完成任务 / 状态变更联动 ====================
  async submitTask(
    participationId: number,
    taskDetail: Record<string, any>,
    operator?: OperatorInfo
  ) {
    const participation = await ActivityParticipation.findByPk(participationId)
    if (!participation) throw new AppError('参与记录不存在', 404)
    if (participation.status === ParticipationStatus.INVALID || participation.status === ParticipationStatus.CANCELLED) {
      throw new AppError('当前参与状态不可提交任务', 400)
    }

    // 任务完成有效性校验
    const now = new Date()
    const signUpTime = new Date(participation.signUpTime).getTime()
    const durationSeconds = (now.getTime() - signUpTime) / 1000
    const anomalySignals: string[] = []

    if (durationSeconds < PARTICIPATION_ANTI_FRAUD_RULES.MIN_TASK_DURATION_SECONDS) {
      anomalySignals.push(`任务完成时间过短（${durationSeconds.toFixed(1)}秒），疑似任务造假`)
    }
    if (!taskDetail || Object.keys(taskDetail).length === 0) {
      anomalySignals.push('任务证据为空')
    }

    const t = await sequelize.transaction()
    try {
      const oldSnap = participationSnapshot(participation)
      const isAnomaly = anomalySignals.length > 0

      const updateData: any = {
        taskStatus: isAnomaly ? TaskCompletionStatus.SUBMITTED : TaskCompletionStatus.VERIFIED,
        taskSubmitTime: now,
        taskVerifyTime: isAnomaly ? null : now,
        taskDetail: JSON.stringify(taskDetail),
        status: isAnomaly ? ParticipationStatus.UNDER_REVIEW : ParticipationStatus.TASK_COMPLETED,
        isAnomaly: isAnomaly ? 1 : participation.isAnomaly,
        anomalyType: isAnomaly ? ParticipationViolationType.FRAUD_TASK : participation.anomalyType,
        anomalyReason: isAnomaly ? anomalySignals.join('; ') : participation.anomalyReason,
        operatorId: operator?.userId || participation.operatorId,
        operatorName: operator?.username || participation.operatorName,
        updateTime: now
      }

      // 任务验证通过自动置为待领奖
      if (!isAnomaly) {
        updateData.status = ParticipationStatus.PENDING_REWARD
      }

      await participation.update(updateData, { transaction: t })

      await t.commit()

      const newSnap = participationSnapshot(participation)
      const changed = computeChangedFields(oldSnap, newSnap)

      await this._writeAudit({
        participationId: participation.id,
        activityId: participation.activityId,
        activityName: participation.activityName,
        userId: participation.userId,
        username: participation.username,
        action: isAnomaly ? ParticipationAuditAction.TASK_REJECTED : ParticipationAuditAction.TASK_COMPLETED,
        operator,
        oldData: oldSnap,
        newData: newSnap,
        changedFields: changed,
        checkDimension: isAnomaly ? ParticipationCheckDimension.TASK_VALIDITY : undefined,
        checkLevel: isAnomaly ? CheckResultLevel.BLOCKER : CheckResultLevel.PASS,
        checkMessage: isAnomaly ? anomalySignals.join('; ') : '任务验证通过',
        violationType: isAnomaly ? ParticipationViolationType.FRAUD_TASK : undefined
      })

      if (isAnomaly) {
        await this._writeAudit({
          participationId: participation.id,
          activityId: participation.activityId,
          activityName: participation.activityName,
          userId: participation.userId,
          username: participation.username,
          action: ParticipationAuditAction.ANOMALY_DETECTED,
          operator,
          violationType: ParticipationViolationType.FRAUD_TASK,
          violationDetail: { signals: anomalySignals, taskDetail },
          remark: anomalySignals.join('; ')
        })
      }

      return {
        id: participation.id,
        status: participation.status,
        statusName: PARTICIPATION_STATUS_NAMES[participation.status],
        taskStatus: participation.taskStatus,
        taskStatusName: TASK_COMPLETION_STATUS_NAMES[participation.taskStatus],
        isAnomaly: participation.isAnomaly,
        anomalyReason: participation.anomalyReason,
        changedFields: changed
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  }

  // ==================== 功能点2：手动变更参与状态（审核通过/拒绝/标记无效等） ====================
  async changeStatus(
    participationId: number,
    targetStatus: ParticipationStatus,
    operator: OperatorInfo,
    options: { remark?: string; violationType?: string; checkDimension?: string } = {}
  ) {
    const participation = await ActivityParticipation.findByPk(participationId)
    if (!participation) throw new AppError('参与记录不存在', 404)

    // 简单状态流转检查
    const VALID_TRANSITIONS: Record<number, number[]> = {
      [ParticipationStatus.PENDING_PARTICIPATE]: [ParticipationStatus.TASK_COMPLETED, ParticipationStatus.PENDING_REWARD, ParticipationStatus.INVALID, ParticipationStatus.CANCELLED, ParticipationStatus.UNDER_REVIEW],
      [ParticipationStatus.UNDER_REVIEW]: [ParticipationStatus.PENDING_PARTICIPATE, ParticipationStatus.TASK_COMPLETED, ParticipationStatus.PENDING_REWARD, ParticipationStatus.INVALID, ParticipationStatus.CANCELLED],
      [ParticipationStatus.TASK_COMPLETED]: [ParticipationStatus.PENDING_REWARD, ParticipationStatus.REWARDED, ParticipationStatus.INVALID],
      [ParticipationStatus.PENDING_REWARD]: [ParticipationStatus.REWARDED, ParticipationStatus.INVALID],
      [ParticipationStatus.REWARDED]: [ParticipationStatus.INVALID],
      [ParticipationStatus.INVALID]: [ParticipationStatus.PENDING_PARTICIPATE],
      [ParticipationStatus.CANCELLED]: []
    }
    const allowed = VALID_TRANSITIONS[participation.status] || []
    if (!allowed.includes(targetStatus)) {
      throw new AppError(`不允许从「${PARTICIPATION_STATUS_NAMES[participation.status]}」变更为「${PARTICIPATION_STATUS_NAMES[targetStatus]}」`, 400)
    }

    const oldSnap = participationSnapshot(participation)
    const t = await sequelize.transaction()
    try {
      const updateData: any = {
        status: targetStatus,
        operatorId: operator.userId,
        operatorName: operator.username,
        updateTime: new Date()
      }
      if (options.remark) updateData.remark = options.remark
      if (options.violationType) {
        updateData.violationType = options.violationType
        updateData.isAnomaly = 1
      }
      if (targetStatus === ParticipationStatus.INVALID) {
        updateData.isAnomaly = 1
        updateData.anomalyType = options.violationType || ParticipationViolationType.INVALID_DATA
        updateData.anomalyReason = options.remark || '人工标记无效'
      }

      await participation.update(updateData, { transaction: t })

      // 同步活动参与数（标记无效/取消时扣减）
      if (targetStatus === ParticipationStatus.INVALID || targetStatus === ParticipationStatus.CANCELLED) {
        await Activity.decrement('participantCount', { by: 1, where: { id: participation.activityId }, transaction: t })
      }

      await t.commit()

      const newSnap = participationSnapshot(participation)
      const changed = computeChangedFields(oldSnap, newSnap)

      let auditAction: ParticipationAuditAction
      if (targetStatus === ParticipationStatus.INVALID) {
        auditAction = ParticipationAuditAction.MANUAL_REMOVED
      } else if (targetStatus === ParticipationStatus.PENDING_PARTICIPATE && participation.status === ParticipationStatus.UNDER_REVIEW) {
        auditAction = ParticipationAuditAction.MANUAL_APPROVED
      } else if (targetStatus === ParticipationStatus.UNDER_REVIEW) {
        auditAction = ParticipationAuditAction.MANUAL_REJECTED
      } else {
        auditAction = ParticipationAuditAction.STATUS_CHANGED
      }

      await this._writeAudit({
        participationId: participation.id,
        activityId: participation.activityId,
        activityName: participation.activityName,
        userId: participation.userId,
        username: participation.username,
        action: auditAction,
        operator,
        oldData: oldSnap,
        newData: newSnap,
        changedFields: changed,
        checkDimension: options.checkDimension,
        violationType: options.violationType,
        remark: options.remark || `状态变更：${PARTICIPATION_STATUS_NAMES[oldSnap.status]} → ${PARTICIPATION_STATUS_NAMES[targetStatus]}`
      })

      return {
        id: participation.id,
        status: participation.status,
        statusName: PARTICIPATION_STATUS_NAMES[participation.status],
        changedFields: changed
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  }

  // ==================== 功能点3：批量审核/剔除/重置 ====================
  async batchApprove(ids: number[], operator: OperatorInfo, options: { remark?: string } = {}) {
    const batchId = genBatchId()
    const results: Array<{ id: number; success: boolean; message?: string; status?: number }> = []

    for (const id of ids) {
      try {
        const r = await this.changeStatus(id, ParticipationStatus.PENDING_PARTICIPATE, operator, {
          ...options,
          checkDimension: ParticipationCheckDimension.DATA_CONSISTENCY
        })
        // 回填 batchId
        await ActivityParticipation.update({ batchId }, { where: { id } })
        await this._writeAudit({
          participationId: id,
          activityId: 0,
          activityName: '',
          userId: 0,
          username: '',
          action: ParticipationAuditAction.BATCH_APPROVED,
          operator,
          batchId,
          remark: options.remark
        })
        results.push({ id, success: true, status: r.status })
      } catch (e: any) {
        results.push({ id, success: false, message: e.message })
      }
    }

    return { batchId, total: ids.length, successCount: results.filter(r => r.success).length, results }
  }

  async batchReject(ids: number[], operator: OperatorInfo, options: { remark?: string; violationType?: string } = {}) {
    const batchId = genBatchId()
    const results: Array<{ id: number; success: boolean; message?: string }> = []

    for (const id of ids) {
      try {
        await this.changeStatus(id, ParticipationStatus.INVALID, operator, {
          remark: options.remark || '批量审核拒绝',
          violationType: options.violationType || ParticipationViolationType.INVALID_DATA,
          checkDimension: ParticipationCheckDimension.DATA_CONSISTENCY
        })
        await ActivityParticipation.update({ batchId }, { where: { id } })
        await this._writeAudit({
          participationId: id,
          activityId: 0,
          activityName: '',
          userId: 0,
          username: '',
          action: ParticipationAuditAction.BATCH_REJECTED,
          operator,
          batchId,
          violationType: options.violationType,
          remark: options.remark
        })
        results.push({ id, success: true })
      } catch (e: any) {
        results.push({ id, success: false, message: e.message })
      }
    }

    return { batchId, total: ids.length, successCount: results.filter(r => r.success).length, results }
  }

  async batchRemove(ids: number[], operator: OperatorInfo, options: { remark?: string; violationType?: string } = {}) {
    const batchId = genBatchId()
    const results: Array<{ id: number; success: boolean; message?: string }> = []

    for (const id of ids) {
      try {
        await this.changeStatus(id, ParticipationStatus.INVALID, operator, {
          remark: options.remark || '批量剔除违规参与',
          violationType: options.violationType || ParticipationViolationType.BRUSH_PARTICIPATION
        })
        await ActivityParticipation.update({ batchId }, { where: { id } })
        await this._writeAudit({
          participationId: id,
          activityId: 0,
          activityName: '',
          userId: 0,
          username: '',
          action: ParticipationAuditAction.BATCH_REMOVED,
          operator,
          batchId,
          violationType: options.violationType,
          remark: options.remark
        })
        results.push({ id, success: true })
      } catch (e: any) {
        results.push({ id, success: false, message: e.message })
      }
    }

    return { batchId, total: ids.length, successCount: results.filter(r => r.success).length, results }
  }

  async batchReset(ids: number[], operator: OperatorInfo, options: { remark?: string } = {}) {
    const batchId = genBatchId()
    const results: Array<{ id: number; success: boolean; message?: string }> = []

    for (const id of ids) {
      try {
        const participation = await ActivityParticipation.findByPk(id)
        if (!participation) { results.push({ id, success: false, message: '记录不存在' }); continue }
        const oldSnap = participationSnapshot(participation)
        await participation.update({
          status: ParticipationStatus.PENDING_PARTICIPATE,
          taskStatus: TaskCompletionStatus.NOT_STARTED,
          rewardStatus: 0,
          taskDetail: '',
          rewardDetail: '',
          taskSubmitTime: null,
          taskVerifyTime: null,
          rewardGrantTime: null,
          isAnomaly: 0,
          anomalyType: '',
          anomalyReason: '',
          violationType: '',
          checkDimension: '',
          checkLevel: '',
          checkMessage: '',
          batchId,
          operatorId: operator.userId,
          operatorName: operator.username,
          updateTime: new Date()
        } as any)
        const newSnap = participationSnapshot(participation)
        await this._writeAudit({
          participationId: id,
          activityId: participation.activityId,
          activityName: participation.activityName,
          userId: participation.userId,
          username: participation.username,
          action: ParticipationAuditAction.BATCH_RESET,
          operator,
          oldData: oldSnap,
          newData: newSnap,
          changedFields: computeChangedFields(oldSnap, newSnap),
          batchId,
          remark: options.remark || '批量重置参与资格'
        })
        results.push({ id, success: true })
      } catch (e: any) {
        results.push({ id, success: false, message: e.message })
      }
    }

    return { batchId, total: ids.length, successCount: results.filter(r => r.success).length, results }
  }

  // ==================== 基础 CRUD ====================
  async list(params: {
    activityId?: number
    userId?: number
    status?: number | number[]
    isAnomaly?: number
    violationType?: string
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
    if (params.isAnomaly !== undefined) where.isAnomaly = params.isAnomaly
    if (params.violationType) where.violationType = params.violationType
    if (params.keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${params.keyword}%` } },
        { nickname: { [Op.like]: `%${params.keyword}%` } },
        { activityName: { [Op.like]: `%${params.keyword}%` } }
      ]
    }

    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(200, params.pageSize || 20)
    const { count, rows } = await ActivityParticipation.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })

    return {
      total: count,
      page,
      pageSize,
      list: rows.map(decorateParticipation)
    }
  }

  async detail(id: number) {
    const rec = await ActivityParticipation.findByPk(id)
    if (!rec) throw new AppError('参与记录不存在', 404)
    return decorateParticipation(rec)
  }

  // ==================== 功能点4：参与溯源 ====================
  async getAuditLogs(params: {
    participationId?: number
    userId?: number
    activityId?: number
    action?: string
    batchId?: string
    page?: number
    pageSize?: number
  }) {
    const where: any = {}
    if (params.participationId) where.participationId = params.participationId
    if (params.userId) where.userId = params.userId
    if (params.activityId) where.activityId = params.activityId
    if (params.action) where.action = params.action
    if (params.batchId) where.batchId = params.batchId

    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(200, params.pageSize || 20)
    const { count, rows } = await ActivityParticipationAuditLog.findAndCountAll({
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
      return data
    })

    return { total: count, page, pageSize, list }
  }

  // ==================== 功能点4：指定参与记录的全链路溯源 + diff 对比 ====================
  async getParticipationTraceSnapshot(participationId: number, auditLogId?: number) {
    const participation = await ActivityParticipation.findByPk(participationId)
    if (!participation) throw new AppError('参与记录不存在', 404)

    const auditLogs = await ActivityParticipationAuditLog.findAll({
      where: { participationId },
      order: [['createTime', 'ASC']]
    })

    const current = decorateParticipation(participation)
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
      return data
    })

    return { current, history, diff, auditLogs: serializedLogs }
  }

  // ==================== 功能点4：清理无效参与数据 ====================
  async clearInvalidParticipations(operator: OperatorInfo, options: { activityId?: number; beforeDays?: number } = {}) {
    const where: any = {
      status: ParticipationStatus.INVALID
    }
    if (options.activityId) where.activityId = options.activityId
    if (options.beforeDays) {
      const beforeDate = new Date(Date.now() - options.beforeDays * 24 * 60 * 60 * 1000)
      where.createTime = { [Op.lt]: beforeDate }
    }

    const list = await ActivityParticipation.findAll({ where, attributes: ['id', 'activityId', 'activityName', 'userId', 'username'] })
    const total = list.length

    for (const p of list) {
      await this._writeAudit({
        participationId: p.id,
        activityId: p.activityId,
        activityName: p.activityName,
        userId: p.userId,
        username: p.username,
        action: ParticipationAuditAction.INVALID_CLEARED,
        operator,
        remark: '清理无效参与数据'
      })
      await p.destroy()
    }

    return { clearedCount: total }
  }

  // ==================== 功能点4：异常参与拦截统计 ====================
  async getAnomalyStats(_operator?: OperatorInfo) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const where = { createTime: { [Op.gte]: sevenDaysAgo } }

    const [anomaly, byViolationType, byDimension, recent] = await Promise.all([
      ActivityParticipation.count({ where: { ...where, isAnomaly: 1 } }),
      ActivityParticipation.findAll({
        where: { ...where, isAnomaly: 1 },
        attributes: ['violationType', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
        group: ['violationType']
      }),
      ActivityParticipationAuditLog.findAll({
        where: { ...where, checkLevel: { [Op.in]: [CheckResultLevel.BLOCKER, CheckResultLevel.ERROR] } },
        attributes: ['checkDimension', 'checkLevel', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
        group: ['checkDimension', 'checkLevel']
      }),
      ActivityParticipationAuditLog.findAll({
        where: { ...where, action: { [Op.in]: [ParticipationAuditAction.SIGNUP_BLOCKED, ParticipationAuditAction.AUTO_INVALID, ParticipationAuditAction.ANOMALY_DETECTED] } },
        order: [['createTime', 'DESC']],
        limit: 20
      })
    ])

    const byViolationMap: Record<string, number> = {}
    for (const r of byViolationType as any[]) {
      const t = r.getDataValue('violationType') || 'unknown'
      byViolationMap[t] = Number(r.getDataValue('cnt')) || 0
    }
    const byDimensionMap: Record<string, Record<string, number>> = {}
    for (const r of byDimension as any[]) {
      const d = r.getDataValue('checkDimension') || 'unknown'
      const l = r.getDataValue('checkLevel') || CheckResultLevel.ERROR
      if (!byDimensionMap[d]) byDimensionMap[d] = {}
      byDimensionMap[d][l] = Number(r.getDataValue('cnt')) || 0
    }

    const recentList = recent.map(r => {
      const data = (r as any).toJSON ? (r as any).toJSON() : { ...r }
      data.violationDetail = safeJSONParse(data.violationDetail, null)
      return data
    })

    return { totalAnomaly: anomaly, byViolationType: byViolationMap, byDimension: byDimensionMap, recent: recentList }
  }

  // ==================== 用户活动中心：我的参与列表 ====================
  async getUserParticipationList(userId: number, params: { status?: number; page?: number; pageSize?: number } = {}) {
    const where: any = { userId }
    if (params.status !== undefined) where.status = params.status

    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(100, params.pageSize || 20)
    const { count, rows } = await ActivityParticipation.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })

    return {
      total: count,
      page,
      pageSize,
      list: rows.map(decorateParticipation)
    }
  }
}

export default new ActivityParticipationService()
