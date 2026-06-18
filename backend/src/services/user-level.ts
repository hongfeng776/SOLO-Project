import { User, UserLevelLog, UserLevelConfig, Note, ViolationRecord, Role } from '@/models/index'
import { AppError } from '@/utils/response'
import { Op } from 'sequelize'
import {
  UserLevel,
  LEVEL_SCORE_THRESHOLDS,
  USER_LEVEL_BENEFITS,
  LevelAdjustReason,
  AdjustOperationType,
  LEVEL_SCORE_FACTOR_NAMES,
  USER_LEVEL_NAMES
} from '@/enums/business'
import sequelize from '@config/database'

interface OperatorInfo {
  userId: number
  username: string
  roles: string[]
  permissions: string[]
}

interface ScoreDetail {
  activity: number
  contentQuality: number
  compliance: number
  accountAge: number
  realName: number
  phoneVerified: number
  total: number
}

interface BenefitChange {
  added: string[]
  removed: string[]
}

interface LogQueryParams {
  page: number
  pageSize: number
  userId?: number
  startTime?: string
  endTime?: string
  operationType?: string
  reason?: string
  operatorId?: number
}

interface LevelListQueryParams {
  page: number
  pageSize: number
  uid?: number
  nickname?: string
  userLevel?: number
  minScore?: number
  maxScore?: number
  isPermanentBanned?: number
  updateStartDate?: string
  updateEndDate?: string
  status?: number
}

export const userLevelService = {
  async checkPermission(operator: OperatorInfo, operation: string): Promise<{ allowed: boolean; reason?: string }> {
    const isSeniorOperator = operator.roles.includes('senior_operator')

    const permissionMap: Record<string, { roles: string[] }> = {
      view_basic: { roles: ['admin', 'senior_operator', 'operator'] },
      view_detail: { roles: ['admin', 'senior_operator'] },
      edit: { roles: ['admin', 'senior_operator'] },
      batch_upgrade: { roles: ['admin', 'senior_operator'] },
      batch_downgrade: { roles: ['admin'] }
    }

    const perm = permissionMap[operation]
    if (!perm) {
      return { allowed: false, reason: '无效的操作类型' }
    }

    const hasRole = operator.roles.some(role => perm.roles.includes(role))
    if (!hasRole) {
      const roleNames: Record<string, string> = {
        admin: '管理员',
        senior_operator: '高级运营',
        operator: '运营'
      }
      const requiredRoles = perm.roles.map(r => roleNames[r]).join('或')
      return { allowed: false, reason: `无权限执行${operation}，需要${requiredRoles}角色` }
    }

    if (operation === 'batch_upgrade' && isSeniorOperator) {
      return { allowed: true }
    }

    return { allowed: true }
  },

  async preCheckUser(userId: number): Promise<{ valid: boolean; issues: string[]; data?: any }> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      return { valid: false, issues: ['用户不存在'] }
    }

    const issues: string[] = []

    if (user.status !== 1) {
      issues.push('账号状态异常')
    }

    if (user.isPermanentBanned === 1) {
      issues.push('账号已被永久封禁')
    }

    const now = new Date()
    if (user.banExpireTime && user.banExpireTime > now) {
      issues.push('账号处于封禁中，解禁时间：' + user.banExpireTime.toLocaleString())
    }

    return { valid: issues.length === 0, issues, data: user }
  },

  async calculateLevelScore(userId: number): Promise<{ totalScore: number; detail: ScoreDetail }> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [notes, violations] = await Promise.all([
      Note.findAndCountAll({
        where: {
          authorId: userId,
          createTime: { [Op.gte]: thirtyDaysAgo }
        } as any
      }),
      ViolationRecord.findAll({
        where: {
          targetId: userId,
          targetType: 'user',
          createTime: { [Op.gte]: thirtyDaysAgo }
        }
      })
    ])

    let activityScore = 0
    const loginDays = user.lastActiveTime && user.lastActiveTime >= thirtyDaysAgo
      ? Math.min(30, Math.ceil((now.getTime() - user.lastActiveTime.getTime()) / (24 * 60 * 60 * 1000)))
      : 0
    const loginScore = Math.min(10, (loginDays / 30) * 10)
    const publishScore = Math.min(10, (notes.count / 20) * 10)
    const interactScore = Math.min(10, (notes.count / 50) * 10)
    activityScore = Math.round(loginScore + publishScore + interactScore)

    let contentQualityScore = 0
    if (notes.count > 0) {
      const avgScore = notes.rows.reduce((sum, n: any) => sum + (n.averageScore || 0), 0) / notes.count
      const qualityScore = Math.min(10, (avgScore / 5) * 10)
      const passRate = notes.rows.filter((n: any) => n.status === 2).length / notes.count
      const passScore = Math.min(10, passRate * 10)
      const violationRate = violations.length / Math.max(1, notes.count)
      const violationScore = Math.max(0, 10 - violationRate * 10 * 2)
      contentQualityScore = Math.round(qualityScore + passScore + violationScore)
    }

    let complianceScore = 25
    if (violations.length > 0) {
      violations.forEach(v => {
        const level = (v as any).violationLevel || 1
        const penalty = level === 1 ? 5 : level === 2 ? 10 : 15
        complianceScore = Math.max(0, complianceScore - penalty)
      })
    }

    let accountAgeScore = 0
    const registerTime = user.createTime || now
    const monthsDiff = (now.getTime() - registerTime.getTime()) / (30 * 24 * 60 * 60 * 1000)
    if (monthsDiff >= 6) {
      accountAgeScore = 15
    } else if (monthsDiff >= 3) {
      accountAgeScore = 10
    } else if (monthsDiff >= 1) {
      accountAgeScore = 5
    }

    const realNameScore = user.realNameVerified === 2 ? 5 : 0
    const phoneScore = user.phoneVerified === 1 ? 5 : 0

    const totalScore = Math.min(100, Math.max(0, Math.round(
      activityScore +
      contentQualityScore +
      complianceScore +
      accountAgeScore +
      realNameScore +
      phoneScore
    )))

    const detail: ScoreDetail = {
      activity: activityScore,
      contentQuality: contentQualityScore,
      compliance: complianceScore,
      accountAge: accountAgeScore,
      realName: realNameScore,
      phoneVerified: phoneScore,
      total: totalScore
    }

    return { totalScore, detail }
  },

  async autoCalculateLevel(userId: number): Promise<{
    success: boolean
    oldLevel: number
    newLevel: number
    oldScore: number
    newScore: number
    levelChanged: boolean
  }> {
    const preCheck = await this.preCheckUser(userId)
    if (!preCheck.data) {
      throw new AppError('用户不存在', 404)
    }
    if (!preCheck.valid) {
      throw new AppError(preCheck.issues.join('；'), 400)
    }

    const user = preCheck.data
    const { totalScore, detail } = await this.calculateLevelScore(userId)

    let newLevel = UserLevel.NORMAL
    if (totalScore >= LEVEL_SCORE_THRESHOLDS[UserLevel.PREMIUM]) {
      newLevel = UserLevel.PREMIUM
    } else if (totalScore >= LEVEL_SCORE_THRESHOLDS[UserLevel.ACTIVE]) {
      newLevel = UserLevel.ACTIVE
    }

    const oldLevel = user.userLevel ?? UserLevel.NORMAL
    const oldScore = user.levelScore ?? 0
    const levelChanged = oldLevel !== newLevel

    if (levelChanged) {
      const t = await sequelize.transaction()

      try {
        const operationType = newLevel > oldLevel ? AdjustOperationType.UPGRADE :
          newLevel < oldLevel ? AdjustOperationType.DOWNGRADE : AdjustOperationType.SET

        const oldBenefits = USER_LEVEL_BENEFITS[oldLevel] || []
        const newBenefits = USER_LEVEL_BENEFITS[newLevel] || []

        const benefitsChanged: BenefitChange = {
          added: newBenefits.filter((b: string) => !oldBenefits.includes(b)),
          removed: oldBenefits.filter((b: string) => !newBenefits.includes(b))
        }

        await user.update({
          userLevel: newLevel,
          levelScore: totalScore,
          levelScoreDetail: JSON.stringify(detail),
          privileges: JSON.stringify(newBenefits),
          levelLastUpdateTime: new Date()
        }, { transaction: t })

        await UserLevelLog.create({
          userId,
          userName: user.username,
          oldLevel,
          newLevel,
          oldScore,
          newScore: totalScore,
          operationType,
          reason: LevelAdjustReason.AUTO_CALCULATE,
          reasonDetail: '系统自动计算调整',
          scoreDetail: JSON.stringify(detail),
          benefitsChanged: JSON.stringify(benefitsChanged),
          isCrossLevel: 0,
          isAutoAdjust: 1
        } as any, { transaction: t })

        await t.commit()
      } catch (error) {
        await t.rollback()
        throw error
      }
    } else {
      await user.update({
        levelScore: totalScore,
        levelScoreDetail: JSON.stringify(detail)
      })
    }

    return {
      success: true,
      oldLevel,
      newLevel,
      oldScore,
      newScore: totalScore,
      levelChanged
    }
  },

  async getLevelList(
    params: LevelListQueryParams,
    operator: OperatorInfo
  ): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
    permission: {
      canView: boolean
      canEdit: boolean
      canUpgrade: boolean
      canDowngrade: boolean
      canBatchUpgrade: boolean
      canBatchDowngrade: boolean
      maxAdjustLevel: number
    }
  }> {
    const permCheck = await this.checkPermission(operator, 'view_basic')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const { page, pageSize, uid, nickname, userLevel, minScore, maxScore, isPermanentBanned, updateStartDate, updateEndDate, status } = params

    const where: any = {}

    if (uid !== undefined) {
      where.id = uid
    }
    if (nickname) {
      where.nickname = { [Op.like]: `%${nickname}%` }
    }
    if (userLevel !== undefined) {
      where.userLevel = userLevel
    }
    if (minScore !== undefined) {
      where.levelScore = { ...where.levelScore, [Op.gte]: minScore }
    }
    if (maxScore !== undefined) {
      where.levelScore = { ...where.levelScore, [Op.lte]: maxScore }
    }
    if (isPermanentBanned !== undefined) {
      where.isPermanentBanned = isPermanentBanned
    }
    if (updateStartDate) {
      where.levelLastUpdateTime = { ...where.levelLastUpdateTime, [Op.gte]: new Date(updateStartDate) }
    }
    if (updateEndDate) {
      where.levelLastUpdateTime = { ...where.levelLastUpdateTime, [Op.lte]: new Date(updateEndDate) }
    }
    if (status !== undefined) {
      where.status = status
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['levelLastUpdateTime', 'DESC']]
    })

    const list = rows.map((row: any) => {
      const data = row.toJSON()
      if (data.levelScoreDetail) {
        try {
          data.levelScoreDetail = JSON.parse(data.levelScoreDetail)
        } catch {
          data.levelScoreDetail = {}
        }
      }
      if (data.privileges) {
        try {
          data.privileges = JSON.parse(data.privileges)
        } catch {
          data.privileges = []
        }
      }
      return data
    })

    const isAdmin = operator.roles.includes('admin')
    const isSeniorOperator = operator.roles.includes('senior_operator')

    return {
      list,
      total: count,
      page,
      pageSize,
      permission: {
        canView: true,
        canEdit: isAdmin || isSeniorOperator,
        canUpgrade: isAdmin || isSeniorOperator,
        canDowngrade: isAdmin || isSeniorOperator,
        canBatchUpgrade: isAdmin || isSeniorOperator,
        canBatchDowngrade: isAdmin,
        maxAdjustLevel: isAdmin ? UserLevel.PREMIUM : UserLevel.ACTIVE
      }
    }
  },

  async adjustLevel(
    userId: number,
    targetLevel: number,
    reason: string,
    reasonDetail: string | undefined,
    operator: OperatorInfo
  ): Promise<{
    success: boolean
    oldLevel: number
    newLevel: number
    oldScore: number
    newScore: number
    benefitsChanged: BenefitChange
    isCrossLevel: boolean
  }> {
    const permCheck = await this.checkPermission(operator, 'edit')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const preCheck = await this.preCheckUser(userId)
    if (!preCheck.data) {
      throw new AppError('用户不存在', 404)
    }
    if (!preCheck.valid) {
      throw new AppError(preCheck.issues.join('；'), 400)
    }

    const user = preCheck.data
    const oldLevel = user.userLevel ?? UserLevel.NORMAL
    const oldScore = user.levelScore ?? 0

    const isCrossLevel =
      (oldLevel === UserLevel.NORMAL && targetLevel === UserLevel.PREMIUM) ||
      (oldLevel === UserLevel.PREMIUM && targetLevel === UserLevel.NORMAL)

    if (isCrossLevel && !operator.roles.includes('admin')) {
      throw new AppError('越级调整需要管理员权限', 403)
    }

    const { totalScore, detail } = await this.calculateLevelScore(userId)

    if (targetLevel > oldLevel && totalScore < LEVEL_SCORE_THRESHOLDS[targetLevel]) {
      throw new AppError(
        `升级到${USER_LEVEL_NAMES[targetLevel]}需要分值达到${LEVEL_SCORE_THRESHOLDS[targetLevel]}分，当前分值${totalScore}`,
        400
      )
    }

    const validateResult = await this.validateLevelAdjustment(userId, oldLevel, targetLevel, operator.userId)
    if (!validateResult.valid) {
      throw new AppError(validateResult.issues.join('；'), 400)
    }

    const t = await sequelize.transaction()

    try {
      const operationType = targetLevel > oldLevel ? AdjustOperationType.UPGRADE :
        targetLevel < oldLevel ? AdjustOperationType.DOWNGRADE : AdjustOperationType.SET

      const oldBenefits = user.privileges ? JSON.parse(user.privileges) : (USER_LEVEL_BENEFITS[oldLevel] || [])
      const newBenefits = USER_LEVEL_BENEFITS[targetLevel] || []

      const benefitsChanged: BenefitChange = {
        added: newBenefits.filter((b: string) => !oldBenefits.includes(b)),
        removed: oldBenefits.filter((b: string) => !newBenefits.includes(b))
      }

      await user.update({
        userLevel: targetLevel,
        levelScore: totalScore,
        levelScoreDetail: JSON.stringify(detail),
        privileges: JSON.stringify(newBenefits),
        levelLastUpdateTime: new Date()
      }, { transaction: t })

      await UserLevelLog.create({
        userId,
        userName: user.username,
        oldLevel,
        newLevel: targetLevel,
        oldScore,
        newScore: totalScore,
        operationType,
        reason,
        reasonDetail,
        scoreDetail: JSON.stringify(detail),
        benefitsChanged: JSON.stringify(benefitsChanged),
        operatorId: operator.userId,
        operatorName: operator.username,
        isCrossLevel: isCrossLevel ? 1 : 0,
        isAutoAdjust: 0
      } as any, { transaction: t })

      await t.commit()

      return {
        success: true,
        oldLevel,
        newLevel: targetLevel,
        oldScore,
        newScore: totalScore,
        benefitsChanged,
        isCrossLevel
      }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async batchAdjustLevel(
    userIds: number[],
    targetLevel: number,
    reason: string,
    reasonDetail: string | undefined,
    operator: OperatorInfo,
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    total: number
    success: number
    fail: number
    results: Array<{
      userId: number
      success: boolean
      error?: string
      oldLevel?: number
      newLevel?: number
    }>
  }> {
    const operation = targetLevel > UserLevel.NORMAL ? 'batch_upgrade' : 'batch_downgrade'
    const permCheck = await this.checkPermission(operator, operation)
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    if (userIds.length === 0) {
      return { total: 0, success: 0, fail: 0, results: [] }
    }

    const results: Array<{
      userId: number
      success: boolean
      error?: string
      oldLevel?: number
      newLevel?: number
    }> = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i]
      try {
        const result = await this.adjustLevel(userId, targetLevel, reason, reasonDetail, operator)
        successCount++
        results.push({
          userId,
          success: true,
          oldLevel: result.oldLevel,
          newLevel: result.newLevel
        })
      } catch (error: any) {
        failCount++
        results.push({
          userId,
          success: false,
          error: error.message
        })
      }

      if (onProgress) {
        onProgress(i + 1, userIds.length)
      }

      if (i % 10 === 0) {
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

  async getLevelLogs(params: LogQueryParams, operator: OperatorInfo) {
    const permCheck = await this.checkPermission(operator, 'view_basic')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const { page, pageSize, userId, startTime, endTime, operationType, reason } = params

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
    if (operationType) {
      where.operationType = operationType
    }
    if (reason) {
      where.reason = reason
    }

    const { count, rows } = await UserLevelLog.findAndCountAll({
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

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  },

  async getUserLevelDetail(userId: number, operator: OperatorInfo) {
    const permCheck = await this.checkPermission(operator, 'view_detail')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const preCheck = await this.preCheckUser(userId)
    if (!preCheck.data) {
      throw new AppError('用户不存在', 404)
    }

    const user = preCheck.data
    const { detail } = await this.calculateLevelScore(userId)

    const levelLogs = await UserLevelLog.findAll({
      where: { userId },
      order: [['createTime', 'DESC']],
      limit: 20
    })

    const currentLevel = user.userLevel ?? UserLevel.NORMAL
    const privileges = user.privileges ? JSON.parse(user.privileges) : (USER_LEVEL_BENEFITS[currentLevel] || [])

    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        userLevel: currentLevel,
        userLevelName: USER_LEVEL_NAMES[currentLevel],
        levelScore: user.levelScore ?? 0,
        levelLastUpdateTime: user.levelLastUpdateTime,
        privileges
      },
      scoreDetail: detail,
      levelLogs,
      preCheck
    }
  },

  async validateLevelAdjustment(
    userId: number,
    oldLevel: number,
    newLevel: number,
    operatorId: number
  ): Promise<{
    valid: boolean
    issues: string[]
    risks: string[]
  }> {
    const issues: string[] = []
    const risks: string[] = []

    const isCrossLevel =
      (oldLevel === UserLevel.NORMAL && newLevel === UserLevel.PREMIUM) ||
      (oldLevel === UserLevel.PREMIUM && newLevel === UserLevel.NORMAL)

    if (isCrossLevel) {
      risks.push('存在越级调整风险')
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentLogs = await UserLevelLog.findAll({
      where: {
        userId,
        createTime: { [Op.gte]: sevenDaysAgo }
      }
    })

    if (recentLogs.length >= 2) {
      issues.push('7天内已调整过2次等级调整，调整间隔过短')
    }

    const operator = await User.findByPk(operatorId, {
      include: [{ model: Role, as: 'roles' }]
    })

    if (operator) {
      const roles = (operator as any).roles?.map((r: any) => r.code) || []
      const isAdmin = roles.includes('admin')
      const isSeniorOperator = roles.includes('senior_operator')

      if (newLevel === UserLevel.PREMIUM && !isAdmin && !isSeniorOperator) {
        issues.push('调整到优质等级需要高级运营或管理员权限')
      }
      if (isCrossLevel && !isAdmin) {
        issues.push('越级调整需要管理员权限')
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      risks
    }
  },

  async analyzeLevelChange(
    userId: number,
    logId: number
  ): Promise<{
    changeReason: string
    complianceStats: {
      totalViolations: number
      recentViolations: number
      violationTypes: Record<string, number>
    }
    riskAssessment: string
    suggestions: string[]
    operationValid: boolean
  }> {
    const log = await UserLevelLog.findByPk(logId)
    if (!log) {
      throw new AppError('等级变更记录不存在', 404)
    }

    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const [allViolations, recentViolations] = await Promise.all([
      ViolationRecord.findAndCountAll({
        where: {
          targetId: userId,
          targetType: 'user'
        }
      }),
      ViolationRecord.findAll({
        where: {
          targetId: userId,
          targetType: 'user',
          createTime: { [Op.gte]: ninetyDaysAgo }
        }
      })
    ])

    const violationTypes: Record<string, number> = {}
    recentViolations.forEach((v: any) => {
      const type = v.violationType || 'unknown'
      violationTypes[type] = (violationTypes[type] || 0) + 1
    })

    let riskAssessment = '低风险'
    const suggestions: string[] = []
    let operationValid = true

    if (log.oldLevel < log.newLevel && recentViolations.length > 0) {
      riskAssessment = '中风险'
      suggestions.push('升级前存在违规记录，建议谨慎评估')
      operationValid = false
    }

    if (log.isCrossLevel === 1 && !log.operatorId) {
      riskAssessment = '高风险'
      suggestions.push('越级调整无明确依据，建议复核')
      operationValid = false
    }

    if (recentViolations.length >= 3) {
      riskAssessment = '高风险'
      suggestions.push('近90天违规记录较多，建议加强监控')
    }

    if (log.reason === LevelAdjustReason.AUTO_CALCULATE) {
      suggestions.push('系统自动调整，建议定期复核')
    }

    return {
      changeReason: log.reasonDetail || log.reason,
      complianceStats: {
        totalViolations: allViolations.count,
        recentViolations: recentViolations.length,
        violationTypes
      },
      riskAssessment,
      suggestions,
      operationValid
    }
  },

  async getConfigs() {
    const configs = await UserLevelConfig.findAll({
      where: { isEnabled: 1 },
      order: [['level', 'ASC']]
    })

    return {
      configs,
      thresholds: LEVEL_SCORE_THRESHOLDS,
      benefits: USER_LEVEL_BENEFITS,
      factorNames: LEVEL_SCORE_FACTOR_NAMES
    }
  },

  async updateConfig(config: {
    level: number
    levelName?: string
    minScore?: number
    maxScore?: number
    weightActivity?: number
    weightContentQuality?: number
    weightCompliance?: number
    weightAccountAge?: number
    benefits?: string[]
    description?: string
  }) {
    const existing = await UserLevelConfig.findOne({ where: { level: config.level } })
    if (!existing) {
      throw new AppError('等级配置不存在', 404)
    }

    const updates: any = {}
    if (config.levelName !== undefined) updates.levelName = config.levelName
    if (config.minScore !== undefined) updates.minScore = config.minScore
    if (config.maxScore !== undefined) updates.maxScore = config.maxScore
    if (config.weightActivity !== undefined) updates.weightActivity = config.weightActivity
    if (config.weightContentQuality !== undefined) updates.weightContentQuality = config.weightContentQuality
    if (config.weightCompliance !== undefined) updates.weightCompliance = config.weightCompliance
    if (config.weightAccountAge !== undefined) updates.weightAccountAge = config.weightAccountAge
    if (config.benefits !== undefined) updates.benefits = JSON.stringify(config.benefits)
    if (config.description !== undefined) updates.description = config.description

    await existing.update(updates)

    return { success: true, message: '配置更新成功' }
  }
}
