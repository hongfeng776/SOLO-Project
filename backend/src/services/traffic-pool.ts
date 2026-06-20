import { TrafficPool, TrafficPoolLog } from '@models/index'
import { AppError } from '@utils/response'
import { Op, Transaction } from 'sequelize'
import sequelize from '@config/database'
import {
  TrafficPoolLevel,
  TrafficPoolStatus,
  ContentAdaptType,
  PLATFORM_TOTAL_FLOW_QUOTA,
  TRAFFIC_POOL_LEVEL_NAMES
} from '@models/traffic-pool'
import {
  TrafficPoolLogType,
  TrafficPoolLogStatus
} from '@models/traffic-pool-log'

const LEVEL_QUOTA_RATIO: Record<number, { min: number; max: number }> = {
  [TrafficPoolLevel.NORMAL]: { min: 0.30, max: 0.50 },
  [TrafficPoolLevel.QUALITY]: { min: 0.20, max: 0.35 },
  [TrafficPoolLevel.HOT]: { min: 0.10, max: 0.25 },
  [TrafficPoolLevel.PREMIUM]: { min: 0.05, max: 0.15 }
}

const LEVEL_MIN_SCORE: Record<number, number> = {
  [TrafficPoolLevel.NORMAL]: 0,
  [TrafficPoolLevel.QUALITY]: 60,
  [TrafficPoolLevel.HOT]: 80,
  [TrafficPoolLevel.PREMIUM]: 90
}

export interface TrafficPoolPermission {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canBatch: boolean
  canBatchStartStop: boolean
  canViewLogs: boolean
}

export interface QuotaValidationResult {
  valid: boolean
  currentTotal: number
  proposedTotal: number
  platformMax: number
  overAllocated: boolean
  levelRatios: Record<number, { current: number; proposed: number; min: number; max: number; valid: boolean }>
  warnings: string[]
  errors: string[]
}

export interface AdmissionValidationResult {
  valid: boolean
  levelValid: boolean
  scoreValid: boolean
  violationValid: boolean
  adaptTypeValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ConfigChangeImpact {
  affectedContentCount: number
  oldWeightMultiplier: number
  newWeightMultiplier: number
  oldDailyQuota: number
  newDailyQuota: number
  weightChangePercent: number
  quotaChangePercent: number
  estimatedExposureChange: number
}

function getPermission(roles: string[]): TrafficPoolPermission {
  const isAdmin = roles.includes('admin')
  const isOperationAdmin = roles.includes('operation_admin')
  const isSeniorOperator = roles.includes('senior_operator')
  const isOperator = roles.includes('operator')

  return {
    canView: isAdmin || isOperationAdmin || isSeniorOperator || isOperator,
    canCreate: isAdmin || isOperationAdmin,
    canEdit: isAdmin || isOperationAdmin || isSeniorOperator,
    canBatch: isAdmin || isOperationAdmin || isSeniorOperator,
    canBatchStartStop: isAdmin || isOperationAdmin,
    canViewLogs: isAdmin || isOperationAdmin || isSeniorOperator || isOperator
  }
}

async function validateQuotaAllocation(
  proposedPools: Array<{ id?: number; poolLevel: number; dailyQuota: number }>,
  excludeId?: number
): Promise<QuotaValidationResult> {
  const allPools = await TrafficPool.findAll({
    where: excludeId ? { id: { [Op.ne]: excludeId } } : {}
  })

  const currentByLevel: Record<number, number> = {
    [TrafficPoolLevel.NORMAL]: 0,
    [TrafficPoolLevel.QUALITY]: 0,
    [TrafficPoolLevel.HOT]: 0,
    [TrafficPoolLevel.PREMIUM]: 0
  }

  allPools.forEach((p) => {
    currentByLevel[p.poolLevel] = (currentByLevel[p.poolLevel] || 0) + Number(p.dailyQuota)
  })

  const proposedByLevel: Record<number, number> = { ...currentByLevel }
  proposedPools.forEach((p) => {
    proposedByLevel[p.poolLevel] = (proposedByLevel[p.poolLevel] || 0) + Number(p.dailyQuota)
  })

  const currentTotal = Object.values(currentByLevel).reduce((a, b) => a + b, 0)
  const proposedTotal = Object.values(proposedByLevel).reduce((a, b) => a + b, 0)

  const levelRatios: QuotaValidationResult['levelRatios'] = {}
  const warnings: string[] = []
  const errors: string[] = []

  Object.keys(LEVEL_QUOTA_RATIO).forEach((key) => {
    const level = Number(key)
    const ratio = LEVEL_QUOTA_RATIO[level]
    const current = currentByLevel[level] || 0
    const proposed = proposedByLevel[level] || 0
    const proposedRatio = PLATFORM_TOTAL_FLOW_QUOTA > 0 ? proposed / PLATFORM_TOTAL_FLOW_QUOTA : 0
    const valid = proposedRatio >= ratio.min && proposedRatio <= ratio.max

    levelRatios[level] = {
      current,
      proposed,
      min: ratio.min,
      max: ratio.max,
      valid
    }

    if (!valid) {
      if (proposedRatio < ratio.min) {
        errors.push(`${TRAFFIC_POOL_LEVEL_NAMES[level]}配额占比过低，最低需${(ratio.min * 100).toFixed(0)}%`)
      } else {
        errors.push(`${TRAFFIC_POOL_LEVEL_NAMES[level]}配额占比过高，最高${(ratio.max * 100).toFixed(0)}%`)
      }
    }
  })

  const overAllocated = proposedTotal > PLATFORM_TOTAL_FLOW_QUOTA
  if (overAllocated) {
    errors.push(`总配额超配，平台总流量配额为${PLATFORM_TOTAL_FLOW_QUOTA.toLocaleString()}`)
  }

  return {
    valid: errors.length === 0,
    currentTotal,
    proposedTotal,
    platformMax: PLATFORM_TOTAL_FLOW_QUOTA,
    overAllocated,
    levelRatios,
    warnings,
    errors
  }
}

function validateAdmissionRules(
  poolLevel: number,
  contentAdaptType: string,
  minContentScore: number,
  maxViolationCount: number
): AdmissionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const requiredMinScore = LEVEL_MIN_SCORE[poolLevel] || 0
  const levelValid = minContentScore >= requiredMinScore
  if (!levelValid) {
    errors.push(`${TRAFFIC_POOL_LEVEL_NAMES[poolLevel]}准入质量分最低需${requiredMinScore}分`)
  }

  const validAdaptTypes = Object.values(ContentAdaptType)
  const adaptTypeValid = validAdaptTypes.includes(contentAdaptType as ContentAdaptType)
  if (!adaptTypeValid) {
    errors.push('内容适配类型不合法')
  }

  if (poolLevel >= TrafficPoolLevel.HOT && maxViolationCount > 0) {
    warnings.push(`${TRAFFIC_POOL_LEVEL_NAMES[poolLevel]}建议设置零违规准入`)
  }

  const scoreValid = minContentScore >= 0 && minContentScore <= 100
  if (!scoreValid) {
    errors.push('质量分需在0-100之间')
  }

  const violationValid = maxViolationCount >= 0 && maxViolationCount <= 10
  if (!violationValid) {
    errors.push('最大违规次数需在0-10之间')
  }

  return {
    valid: errors.length === 0,
    levelValid,
    scoreValid,
    violationValid,
    adaptTypeValid,
    errors,
    warnings
  }
}

function calculateChangeImpact(
  oldPool: TrafficPool,
  newData: Partial<{ weightMultiplier: number; dailyQuota: number }>
): ConfigChangeImpact {
  const oldWeight = Number(oldPool.weightMultiplier) || 1
  const newWeight = newData.weightMultiplier !== undefined ? Number(newData.weightMultiplier) : oldWeight
  const oldQuota = Number(oldPool.dailyQuota) || 0
  const newQuota = newData.dailyQuota !== undefined ? Number(newData.dailyQuota) : oldQuota

  const weightChangePercent = oldWeight > 0 ? ((newWeight - oldWeight) / oldWeight) * 100 : 0
  const quotaChangePercent = oldQuota > 0 ? ((newQuota - oldQuota) / oldQuota) * 100 : 0

  const contentCount = Number(oldPool.contentCount) || 0
  const oldAvgExposure = Number(oldPool.avgExposure) || 0
  const estimatedExposureChange = contentCount * oldAvgExposure * (weightChangePercent / 100)

  return {
    affectedContentCount: contentCount,
    oldWeightMultiplier: oldWeight,
    newWeightMultiplier: newWeight,
    oldDailyQuota: oldQuota,
    newDailyQuota: newQuota,
    weightChangePercent,
    quotaChangePercent,
    estimatedExposureChange: Math.round(estimatedExposureChange)
  }
}

async function createLog(
  t: Transaction,
  data: {
    poolId: number
    poolName?: string
    logType: string
    operatorId?: number
    operatorName?: string
    operatorRole?: string
    oldConfig?: Record<string, any>
    newConfig?: Record<string, any>
    changedFields?: string[]
    reason?: string
    status?: number
    blockReason?: string
    validationResult?: any
    impact?: ConfigChangeImpact
    ip?: string
    userAgent?: string
  }
) {
  await TrafficPoolLog.create(
    {
      poolId: data.poolId,
      poolName: data.poolName || '',
      logType: data.logType,
      operatorId: data.operatorId,
      operatorName: data.operatorName || '',
      operatorRole: data.operatorRole || '',
      oldConfig: data.oldConfig ? JSON.stringify(data.oldConfig) : undefined,
      newConfig: data.newConfig ? JSON.stringify(data.newConfig) : undefined,
      changedFields: data.changedFields ? data.changedFields.join(',') : '',
      reason: data.reason || '',
      status: data.status ?? TrafficPoolLogStatus.SUCCESS,
      blockReason: data.blockReason || '',
      validationResult: data.validationResult ? JSON.stringify(data.validationResult) : undefined,
      affectedContentCount: data.impact?.affectedContentCount || 0,
      oldWeightMultiplier: data.impact?.oldWeightMultiplier,
      newWeightMultiplier: data.impact?.newWeightMultiplier,
      oldDailyQuota: data.impact?.oldDailyQuota,
      newDailyQuota: data.impact?.newDailyQuota,
      ip: data.ip || '',
      userAgent: data.userAgent || ''
    },
    { transaction: t }
  )
}

export const trafficPoolService = {
  async list(params: {
    page: number
    pageSize: number
    keyword?: string
    poolLevel?: number
    contentAdaptType?: string
    status?: number
    roles?: string[]
  }) {
    const { page, pageSize, keyword, poolLevel, contentAdaptType, status, roles = [] } = params
    const permission = getPermission(roles)
    const where: any = {}

    if (keyword) {
      where[Op.or] = [
        { poolName: { [Op.like]: `%${keyword}%` } },
        { poolCode: { [Op.like]: `%${keyword}%` } }
      ]
    }

    if (poolLevel !== undefined) {
      where.poolLevel = poolLevel
    }

    if (contentAdaptType) {
      where.contentAdaptType = contentAdaptType
    }

    if (status !== undefined) {
      where.status = status
    }

    const { count, rows } = await TrafficPool.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['sortOrder', 'ASC'], ['poolLevel', 'DESC'], ['createTime', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      permission
    }
  },

  async detail(id: number, roles: string[] = []) {
    const permission = getPermission(roles)
    if (!permission.canView) {
      throw new AppError('无权限查看', 403)
    }

    const pool = await TrafficPool.findByPk(id)
    if (!pool) {
      throw new AppError('流量池不存在', 404)
    }

    return {
      pool,
      permission
    }
  },

  async validateCreateData(data: {
    poolLevel: number
    contentAdaptType: string
    dailyQuota: number
    minContentScore: number
    maxViolationCount: number
  }) {
    const admissionValidation = validateAdmissionRules(
      data.poolLevel,
      data.contentAdaptType,
      data.minContentScore,
      data.maxViolationCount
    )

    const quotaValidation = await validateQuotaAllocation([
      { poolLevel: data.poolLevel, dailyQuota: data.dailyQuota }
    ])

    return {
      admission: admissionValidation,
      quota: quotaValidation,
      valid: admissionValidation.valid && quotaValidation.valid
    }
  },

  async create(data: {
    poolName: string
    poolCode: string
    poolLevel: number
    contentAdaptType: string
    dailyQuota: number
    weightMultiplier: number
    minContentScore: number
    maxViolationCount: number
    admissionRules?: Record<string, any>
    description?: string
    sortOrder?: number
    operatorId?: number
    operatorName?: string
    operatorRole?: string
    ip?: string
    userAgent?: string
    roles?: string[]
  }) {
    const permission = getPermission(data.roles || [])
    if (!permission.canCreate) {
      throw new AppError('无权限创建流量池', 403)
    }

    const existing = await TrafficPool.findOne({ where: { poolCode: data.poolCode } })
    if (existing) {
      throw new AppError('流量池编码已存在', 400)
    }

    const validation = await this.validateCreateData(data)
    if (!validation.valid) {
      const allErrors = [...validation.admission.errors, ...validation.quota.errors]
      throw new AppError(allErrors[0] || '参数校验失败', 400)
    }

    const t = await sequelize.transaction()
    try {
      const pool = await TrafficPool.create(
        {
          poolName: data.poolName,
          poolCode: data.poolCode,
          poolLevel: data.poolLevel,
          contentAdaptType: data.contentAdaptType,
          dailyQuota: data.dailyQuota,
          remainingQuota: data.dailyQuota,
          weightMultiplier: data.weightMultiplier,
          minContentScore: data.minContentScore,
          maxViolationCount: data.maxViolationCount,
          admissionRules: data.admissionRules ? JSON.stringify(data.admissionRules) : undefined,
          description: data.description || '',
          sortOrder: data.sortOrder || 0
        },
        { transaction: t }
      )

      await createLog(t, {
        poolId: pool.id,
        poolName: pool.poolName,
        logType: TrafficPoolLogType.CREATE,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        operatorRole: data.operatorRole,
        newConfig: pool.toJSON(),
        validationResult: validation,
        ip: data.ip,
        userAgent: data.userAgent
      })

      await t.commit()
      return { id: pool.id, poolName: pool.poolName }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async update(
    id: number,
    data: {
      poolName?: string
      poolLevel?: number
      contentAdaptType?: string
      dailyQuota?: number
      weightMultiplier?: number
      minContentScore?: number
      maxViolationCount?: number
      admissionRules?: Record<string, any>
      description?: string
      status?: number
      sortOrder?: number
      reason?: string
      operatorId?: number
      operatorName?: string
      operatorRole?: string
      ip?: string
      userAgent?: string
      roles?: string[]
    }
  ) {
    const permission = getPermission(data.roles || [])
    if (!permission.canEdit) {
      throw new AppError('无权限编辑流量池', 403)
    }

    const pool = await TrafficPool.findByPk(id)
    if (!pool) {
      throw new AppError('流量池不存在', 404)
    }

    if (data.dailyQuota !== undefined || data.poolLevel !== undefined) {
      const quotaValidation = await validateQuotaAllocation(
        [
          {
            id,
            poolLevel: data.poolLevel !== undefined ? data.poolLevel : pool.poolLevel,
            dailyQuota: data.dailyQuota !== undefined ? data.dailyQuota : Number(pool.dailyQuota)
          }
        ],
        id
      )
      if (!quotaValidation.valid) {
        throw new AppError(quotaValidation.errors[0] || '配额校验失败', 400)
      }
    }

    if (data.minContentScore !== undefined || data.maxViolationCount !== undefined || data.contentAdaptType !== undefined || data.poolLevel !== undefined) {
      const admissionValidation = validateAdmissionRules(
        data.poolLevel !== undefined ? data.poolLevel : pool.poolLevel,
        data.contentAdaptType || pool.contentAdaptType,
        data.minContentScore !== undefined ? data.minContentScore : pool.minContentScore,
        data.maxViolationCount !== undefined ? data.maxViolationCount : pool.maxViolationCount
      )
      if (!admissionValidation.valid) {
        throw new AppError(admissionValidation.errors[0] || '准入规则校验失败', 400)
      }
    }

    const t = await sequelize.transaction()
    try {
      const oldData = pool.toJSON()
      const changedFields: string[] = []

      const updateData: any = {}
      for (const key of Object.keys(data)) {
        if (
          key !== 'reason' &&
          key !== 'operatorId' &&
          key !== 'operatorName' &&
          key !== 'operatorRole' &&
          key !== 'ip' &&
          key !== 'userAgent' &&
          key !== 'roles'
        ) {
          if (key === 'admissionRules') {
            updateData[key] = data.admissionRules ? JSON.stringify(data.admissionRules) : pool.admissionRules
          } else if (key === 'dailyQuota') {
            const newQuota = Number(data.dailyQuota) || 0
            const usedQuota = Number(pool.usedQuota) || 0
            updateData[key] = newQuota
            updateData.remainingQuota = Math.max(0, newQuota - usedQuota)
          } else {
            updateData[key] = (data as any)[key]
          }
          changedFields.push(key)
        }
      }

      await pool.update(updateData, { transaction: t })

      const impact = calculateChangeImpact(oldData as TrafficPool, {
        weightMultiplier: data.weightMultiplier,
        dailyQuota: data.dailyQuota
      })

      let logType = TrafficPoolLogType.UPDATE
      if (data.status !== undefined && data.status !== oldData.status) {
        logType = TrafficPoolLogType.STATUS_CHANGE
      } else if (data.weightMultiplier !== undefined && Number(data.weightMultiplier) !== Number(oldData.weightMultiplier)) {
        logType = TrafficPoolLogType.WEIGHT_CHANGE
      } else if (data.dailyQuota !== undefined && Number(data.dailyQuota) !== Number(oldData.dailyQuota)) {
        logType = TrafficPoolLogType.QUOTA_CHANGE
      } else if (data.admissionRules !== undefined || data.minContentScore !== undefined || data.maxViolationCount !== undefined) {
        logType = TrafficPoolLogType.RULE_CHANGE
      }

      await createLog(t, {
        poolId: pool.id,
        poolName: pool.poolName,
        logType,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        operatorRole: data.operatorRole,
        oldConfig: oldData,
        newConfig: pool.toJSON(),
        changedFields,
        reason: data.reason,
        impact,
        ip: data.ip,
        userAgent: data.userAgent
      })

      await t.commit()
      return { id: pool.id, impact }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async remove(id: number, roles: string[] = []) {
    const permission = getPermission(roles)
    if (!permission.canEdit) {
      throw new AppError('无权限删除流量池', 403)
    }

    const pool = await TrafficPool.findByPk(id)
    if (!pool) {
      throw new AppError('流量池不存在', 404)
    }

    if (Number(pool.contentCount) > 0) {
      throw new AppError('流量池内仍有内容，无法删除', 400)
    }

    await pool.destroy()
    return true
  },

  async batchUpdateQuota(
    data: {
      ids: number[]
      dailyQuota: number
      reason?: string
      operatorId?: number
      operatorName?: string
      operatorRole?: string
      ip?: string
      userAgent?: string
      roles?: string[]
    }
  ) {
    const permission = getPermission(data.roles || [])
    if (!permission.canBatch) {
      throw new AppError('无权限批量操作', 403)
    }

    const pools = await TrafficPool.findAll({ where: { id: { [Op.in]: data.ids } } })
    if (pools.length === 0) {
      throw new AppError('未找到流量池', 404)
    }

    const proposedAllocations = pools.map((p) => ({
      id: p.id,
      poolLevel: p.poolLevel,
      dailyQuota: data.dailyQuota
    }))

    const excludedIds = pools.map((p) => p.id)
    for (const poolId of excludedIds) {
      const quotaValidation = await validateQuotaAllocation(proposedAllocations, poolId)
      if (!quotaValidation.valid) {
        throw new AppError(quotaValidation.errors[0] || '批量配额校验失败', 400)
      }
    }

    const t = await sequelize.transaction()
    try {
      const results: Array<{ id: number; poolName: string; success: boolean; error?: string }> = []

      for (const pool of pools) {
        try {
          const oldData = pool.toJSON()
          const usedQuota = Number(pool.usedQuota) || 0
          await pool.update(
            {
              dailyQuota: data.dailyQuota,
              remainingQuota: Math.max(0, data.dailyQuota - usedQuota)
            },
            { transaction: t }
          )

          const impact = calculateChangeImpact(oldData as TrafficPool, { dailyQuota: data.dailyQuota })

          await createLog(t, {
            poolId: pool.id,
            poolName: pool.poolName,
            logType: TrafficPoolLogType.BATCH_OPERATION,
            operatorId: data.operatorId,
            operatorName: data.operatorName,
            operatorRole: data.operatorRole,
            oldConfig: oldData,
            newConfig: pool.toJSON(),
            changedFields: ['dailyQuota'],
            reason: data.reason,
            impact,
            ip: data.ip,
            userAgent: data.userAgent
          })

          results.push({ id: pool.id, poolName: pool.poolName, success: true })
        } catch (err: any) {
          results.push({ id: pool.id, poolName: pool.poolName, success: false, error: err.message })
        }
      }

      await t.commit()
      return {
        total: pools.length,
        success: results.filter((r) => r.success).length,
        fail: results.filter((r) => !r.success).length,
        results
      }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async batchUpdateRules(
    data: {
      ids: number[]
      minContentScore?: number
      maxViolationCount?: number
      admissionRules?: Record<string, any>
      reason?: string
      operatorId?: number
      operatorName?: string
      operatorRole?: string
      ip?: string
      userAgent?: string
      roles?: string[]
    }
  ) {
    const permission = getPermission(data.roles || [])
    if (!permission.canBatch) {
      throw new AppError('无权限批量操作', 403)
    }

    const pools = await TrafficPool.findAll({ where: { id: { [Op.in]: data.ids } } })
    if (pools.length === 0) {
      throw new AppError('未找到流量池', 404)
    }

    for (const pool of pools) {
      const admissionValidation = validateAdmissionRules(
        pool.poolLevel,
        pool.contentAdaptType,
        data.minContentScore !== undefined ? data.minContentScore : pool.minContentScore,
        data.maxViolationCount !== undefined ? data.maxViolationCount : pool.maxViolationCount
      )
      if (!admissionValidation.valid) {
        throw new AppError(`流量池[${pool.poolName}]${admissionValidation.errors[0]}`, 400)
      }
    }

    const t = await sequelize.transaction()
    try {
      const results: Array<{ id: number; poolName: string; success: boolean; error?: string }> = []
      const changedFields: string[] = []
      if (data.minContentScore !== undefined) changedFields.push('minContentScore')
      if (data.maxViolationCount !== undefined) changedFields.push('maxViolationCount')
      if (data.admissionRules !== undefined) changedFields.push('admissionRules')

      for (const pool of pools) {
        try {
          const oldData = pool.toJSON()
          const updateData: any = {}
          if (data.minContentScore !== undefined) updateData.minContentScore = data.minContentScore
          if (data.maxViolationCount !== undefined) updateData.maxViolationCount = data.maxViolationCount
          if (data.admissionRules !== undefined) updateData.admissionRules = JSON.stringify(data.admissionRules)

          await pool.update(updateData, { transaction: t })

          await createLog(t, {
            poolId: pool.id,
            poolName: pool.poolName,
            logType: TrafficPoolLogType.BATCH_OPERATION,
            operatorId: data.operatorId,
            operatorName: data.operatorName,
            operatorRole: data.operatorRole,
            oldConfig: oldData,
            newConfig: pool.toJSON(),
            changedFields,
            reason: data.reason,
            ip: data.ip,
            userAgent: data.userAgent
          })

          results.push({ id: pool.id, poolName: pool.poolName, success: true })
        } catch (err: any) {
          results.push({ id: pool.id, poolName: pool.poolName, success: false, error: err.message })
        }
      }

      await t.commit()
      return {
        total: pools.length,
        success: results.filter((r) => r.success).length,
        fail: results.filter((r) => !r.success).length,
        results
      }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async batchToggleStatus(
    data: {
      ids: number[]
      status: number
      reason?: string
      operatorId?: number
      operatorName?: string
      operatorRole?: string
      ip?: string
      userAgent?: string
      roles?: string[]
    }
  ) {
    const permission = getPermission(data.roles || [])
    if (!permission.canBatchStartStop) {
      throw new AppError('无权限执行批量启停操作，需高级权限', 403)
    }

    const pools = await TrafficPool.findAll({ where: { id: { [Op.in]: data.ids } } })
    if (pools.length === 0) {
      throw new AppError('未找到流量池', 404)
    }

    if (data.status === TrafficPoolStatus.DISABLED) {
      const activeContentPools = pools.filter((p) => Number(p.contentCount) > 0)
      if (activeContentPools.length > 0 && !data.reason) {
        throw new AppError('停用含内容的流量池需说明原因', 400)
      }
    }

    const t = await sequelize.transaction()
    try {
      const results: Array<{ id: number; poolName: string; success: boolean; error?: string }> = []

      for (const pool of pools) {
        try {
          const oldData = pool.toJSON()
          await pool.update({ status: data.status }, { transaction: t })

          const impact = calculateChangeImpact(oldData as TrafficPool, {})

          await createLog(t, {
            poolId: pool.id,
            poolName: pool.poolName,
            logType: TrafficPoolLogType.BATCH_OPERATION,
            operatorId: data.operatorId,
            operatorName: data.operatorName,
            operatorRole: data.operatorRole,
            oldConfig: oldData,
            newConfig: pool.toJSON(),
            changedFields: ['status'],
            reason: data.reason,
            impact,
            ip: data.ip,
            userAgent: data.userAgent
          })

          results.push({ id: pool.id, poolName: pool.poolName, success: true })
        } catch (err: any) {
          results.push({ id: pool.id, poolName: pool.poolName, success: false, error: err.message })
        }
      }

      await t.commit()
      return {
        total: pools.length,
        success: results.filter((r) => r.success).length,
        fail: results.filter((r) => !r.success).length,
        results
      }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async getQuotaStats() {
    const pools = await TrafficPool.findAll({ attributes: ['poolLevel', 'dailyQuota', 'usedQuota', 'remainingQuota'] })

    const statsByLevel: Record<number, { quota: number; used: number; remaining: number; count: number }> = {
      [TrafficPoolLevel.NORMAL]: { quota: 0, used: 0, remaining: 0, count: 0 },
      [TrafficPoolLevel.QUALITY]: { quota: 0, used: 0, remaining: 0, count: 0 },
      [TrafficPoolLevel.HOT]: { quota: 0, used: 0, remaining: 0, count: 0 },
      [TrafficPoolLevel.PREMIUM]: { quota: 0, used: 0, remaining: 0, count: 0 }
    }

    let totalQuota = 0
    let totalUsed = 0

    pools.forEach((p) => {
      const level = p.poolLevel
      const quota = Number(p.dailyQuota) || 0
      const used = Number(p.usedQuota) || 0
      const remaining = Number(p.remainingQuota) || 0

      statsByLevel[level].quota += quota
      statsByLevel[level].used += used
      statsByLevel[level].remaining += remaining
      statsByLevel[level].count += 1

      totalQuota += quota
      totalUsed += used
    })

    return {
      platformMax: PLATFORM_TOTAL_FLOW_QUOTA,
      totalQuota,
      totalUsed,
      totalRemaining: totalQuota - totalUsed,
      usageRate: totalQuota > 0 ? (totalUsed / totalQuota) * 100 : 0,
      byLevel: statsByLevel,
      levelRatios: Object.keys(statsByLevel).reduce((acc, key) => {
        const level = Number(key)
        const stat = statsByLevel[level]
        acc[level] = {
          quotaRatio: totalQuota > 0 ? (stat.quota / totalQuota) * 100 : 0,
          usageRate: stat.quota > 0 ? (stat.used / stat.quota) * 100 : 0
        }
        return acc
      }, {} as Record<number, { quotaRatio: number; usageRate: number }>)
    }
  },

  async listLogs(params: {
    page: number
    pageSize: number
    poolId?: number
    logType?: string
    status?: number
    keyword?: string
    startDate?: string
    endDate?: string
    roles?: string[]
  }) {
    const { page, pageSize, poolId, logType, status, keyword, startDate, endDate, roles = [] } = params
    const permission = getPermission(roles)
    if (!permission.canViewLogs) {
      throw new AppError('无权限查看日志', 403)
    }

    const where: any = {}

    if (poolId !== undefined) {
      where.poolId = poolId
    }

    if (logType) {
      where.logType = logType
    }

    if (status !== undefined) {
      where.status = status
    }

    if (keyword) {
      where[Op.or] = [
        { poolName: { [Op.like]: `%${keyword}%` } },
        { operatorName: { [Op.like]: `%${keyword}%` } },
        { reason: { [Op.like]: `%${keyword}%` } }
      ]
    }

    if (startDate && endDate) {
      where.createTime = { [Op.between]: [startDate, `${endDate} 23:59:59`] }
    }

    const { count, rows } = await TrafficPoolLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createTime', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      permission
    }
  },

  async analyzeLog(logId: number, roles: string[] = []) {
    const permission = getPermission(roles)
    if (!permission.canViewLogs) {
      throw new AppError('无权限查看', 403)
    }

    const log = await TrafficPoolLog.findByPk(logId)
    if (!log) {
      throw new AppError('日志不存在', 404)
    }

    let oldConfig: any = null
    let newConfig: any = null
    let validationResult: any = null

    try {
      if (log.oldConfig) oldConfig = JSON.parse(log.oldConfig)
    } catch (_e) {}
    try {
      if (log.newConfig) newConfig = JSON.parse(log.newConfig)
    } catch (_e) {}
    try {
      if (log.validationResult) validationResult = JSON.parse(log.validationResult)
    } catch (_e) {}

    const pool = await TrafficPool.findByPk(log.poolId)

    return {
      log,
      pool,
      oldConfig,
      newConfig,
      validationResult,
      diff: {
        changedFields: log.changedFields ? log.changedFields.split(',') : [],
        oldWeightMultiplier: log.oldWeightMultiplier,
        newWeightMultiplier: log.newWeightMultiplier,
        oldDailyQuota: log.oldDailyQuota,
        newDailyQuota: log.newDailyQuota
      }
    }
  }
}
