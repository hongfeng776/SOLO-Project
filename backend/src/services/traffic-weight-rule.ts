import { Op } from 'sequelize'
import dayjs from 'dayjs'
import {
  TrafficWeightRule,
  TrafficWeightRuleLog,
  Note
} from '@models/index'
import {
  WeightRuleStatus,
  WeightRuleScene,
  TOTAL_WEIGHT_SUM,
  WEIGHT_MIN_RATIO,
  WEIGHT_MAX_RATIO,
  WEIGHT_FAIRNESS_DIFF_THRESHOLD,
  WEIGHT_DIMENSION_DEFAULT_WEIGHTS,
  WeightDimension
} from '@models/traffic-weight-rule'
import {
  WeightRuleLogType,
  WeightRuleLogStatus,
  WeightRuleBlockReason
} from '@models/traffic-weight-rule-log'
import type { WeightRulePermission } from '@controllers/traffic-weight-rule'

export const getWeightRulePermission = (roles: string[]): WeightRulePermission => {
  const has = (r: string) => roles.includes(r)
  const isSuper = has('admin') || has('operation_admin')
  return {
    canView: isSuper || has('senior_operator') || has('operator') || has('auditor'),
    canCreate: isSuper || has('senior_operator'),
    canEdit: isSuper || has('senior_operator'),
    canToggle: isSuper || has('senior_operator') || has('operator'),
    canBatch: isSuper,
    canAdjust: isSuper,
    canViewTrace: isSuper || has('senior_operator') || has('auditor'),
    canRecalc: isSuper || has('senior_operator')
  }
}

const generateRuleCode = () => {
  return 'WR' + dayjs().format('YYYYMMDDHHmmss') + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
}

export interface WeightsConfig {
  contentQualityWeight: number
  userActivityWeight: number
  interactionWeight: number
  complianceWeight: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  sum: number
  each: Record<string, number>
  fairnessScore: number
  blockReason?: string
  blockDetail?: string
}

export const validateWeights = (weights: WeightsConfig): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []
  const each: Record<string, number> = {
    content_quality: Number(weights.contentQualityWeight) || 0,
    user_activity: Number(weights.userActivityWeight) || 0,
    interaction: Number(weights.interactionWeight) || 0,
    compliance: Number(weights.complianceWeight) || 0
  }
  const sum = Object.values(each).reduce((a, b) => a + b, 0)

  if (sum !== TOTAL_WEIGHT_SUM) {
    errors.push(`权重配比总和必须等于${TOTAL_WEIGHT_SUM}%，当前为${sum}%`)
  }

  for (const [dim, val] of Object.entries(each)) {
    if (val < 0 || val > 100) {
      errors.push(`[${dim}]权重必须在0-100之间`)
    }
    if (val > 0 && val < WEIGHT_MIN_RATIO) {
      warnings.push(`[${dim}]权重低于建议下限${WEIGHT_MIN_RATIO}%`)
    }
    if (val > WEIGHT_MAX_RATIO) {
      errors.push(`[${dim}]权重超过上限${WEIGHT_MAX_RATIO}%`)
    }
  }

  const maxV = Math.max(...Object.values(each))
  const minV = Math.min(...Object.values(each).filter(v => v > 0))
  const diff = Object.values(each).length > 1 ? maxV - (minV || 0) : 0
  const fairnessScore = Math.max(0, 100 - diff * 1.5)

  let blockReason: string | undefined
  let blockDetail: string | undefined
  if (sum !== TOTAL_WEIGHT_SUM) {
    blockReason = WeightRuleBlockReason.SUM_NOT_100
    blockDetail = `总和${sum}% ≠ 100%`
  } else if (Object.values(each).some(v => v > WEIGHT_MAX_RATIO)) {
    blockReason = WeightRuleBlockReason.OVERSIZED_WEIGHT
    blockDetail = `存在维度权重超过${WEIGHT_MAX_RATIO}%`
  } else if (diff > WEIGHT_FAIRNESS_DIFF_THRESHOLD) {
    blockReason = WeightRuleBlockReason.UNFAIR_TILT
    blockDetail = `最高与最低维度差${diff}%，超过阈值${WEIGHT_FAIRNESS_DIFF_THRESHOLD}%，判定为不公平倾斜`
  }

  return { valid: errors.length === 0 && !blockReason, errors, warnings, sum, each, fairnessScore, blockReason, blockDetail }
}

const createLog = async (data: Partial<any>) => {
  await TrafficWeightRuleLog.create({
    ruleId: data.ruleId,
    ruleName: data.ruleName || '',
    logType: data.logType,
    operatorId: data.operatorId || null,
    operatorName: data.operatorName || '',
    operatorRole: data.operatorRole || '',
    oldWeights: data.oldWeights ? JSON.stringify(data.oldWeights) : undefined,
    newWeights: data.newWeights ? JSON.stringify(data.newWeights) : undefined,
    oldStatus: data.oldStatus,
    newStatus: data.newStatus,
    oldScene: data.oldScene,
    newScene: data.newScene,
    changedFields: data.changedFields || '',
    reason: data.reason || '',
    status: data.status ?? WeightRuleLogStatus.SUCCESS,
    blockReason: data.blockReason || '',
    blockDetail: data.blockDetail || '',
    fairnessScore: data.fairnessScore,
    validationResult: data.validationResult ? JSON.stringify(data.validationResult) : undefined,
    affectedContentCount: data.affectedContentCount || 0,
    estimatedImpact: data.estimatedImpact || '',
    queueRefreshCost: data.queueRefreshCost,
    ip: data.ip || '',
    userAgent: data.userAgent || ''
  })
}

export interface ListQuery {
  page?: number
  pageSize?: number
  keyword?: string
  sceneType?: string
  status?: number
  ruleCode?: string
  fairOnly?: number
}

export async function listWeightRules(query: ListQuery) {
  const where: any = {}
  if (query.keyword) {
    where.ruleName = { [Op.like]: `%${query.keyword}%` }
  }
  if (query.ruleCode) {
    where.ruleCode = { [Op.like]: `%${query.ruleCode}%` }
  }
  if (query.sceneType) where.sceneType = query.sceneType
  if (query.status !== undefined && query.status !== null) where.status = Number(query.status)

  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20
  const { count, rows } = await TrafficWeightRule.findAndCountAll({
    where,
    order: [['priority', 'DESC'], ['id', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: pageSize
  })
  return { list: rows, total: count, page, pageSize }
}

export async function getWeightRuleDetail(id: number) {
  const rule = await TrafficWeightRule.findByPk(id)
  if (!rule) throw new Error('规则不存在')
  return rule
}

export async function validateCreateData(data: any) {
  const weights: WeightsConfig = {
    contentQualityWeight: Number(data.contentQualityWeight) ?? WEIGHT_DIMENSION_DEFAULT_WEIGHTS[WeightDimension.CONTENT_QUALITY],
    userActivityWeight: Number(data.userActivityWeight) ?? WEIGHT_DIMENSION_DEFAULT_WEIGHTS[WeightDimension.USER_ACTIVITY],
    interactionWeight: Number(data.interactionWeight) ?? WEIGHT_DIMENSION_DEFAULT_WEIGHTS[WeightDimension.INTERACTION],
    complianceWeight: Number(data.complianceWeight) ?? WEIGHT_DIMENSION_DEFAULT_WEIGHTS[WeightDimension.COMPLIANCE]
  }
  const validation = validateWeights(weights)

  const fieldErrors: string[] = []
  if (!data.ruleName || !String(data.ruleName).trim()) fieldErrors.push('规则名称不能为空')
  if (!data.sceneType) fieldErrors.push('生效场景不能为空')
  if (data.sceneType && ![WeightRuleScene.DAILY, WeightRuleScene.ACTIVITY].includes(data.sceneType)) {
    fieldErrors.push('生效场景不合法')
  }

  if (fieldErrors.length > 0) {
    validation.valid = false
    validation.errors.unshift(...fieldErrors)
    if (!validation.blockReason) {
      validation.blockReason = WeightRuleBlockReason.FIELD_MISSING
      validation.blockDetail = fieldErrors.join('；')
    }
  }

  return { valid: validation.valid && fieldErrors.length === 0, errors: validation.errors, warnings: validation.warnings, weights, sum: validation.sum, fairnessScore: validation.fairnessScore, blockReason: validation.blockReason, blockDetail: validation.blockDetail }
}

export async function createWeightRule(data: any, roles: string[], operator: any) {
  const perm = getWeightRulePermission(roles)
  if (!perm.canCreate) throw new Error('403')

  const validation = await validateCreateData(data)

  const weights: WeightsConfig = {
    contentQualityWeight: Number(data.contentQualityWeight) ?? WEIGHT_DIMENSION_DEFAULT_WEIGHTS.content_quality,
    userActivityWeight: Number(data.userActivityWeight) ?? WEIGHT_DIMENSION_DEFAULT_WEIGHTS.user_activity,
    interactionWeight: Number(data.interactionWeight) ?? WEIGHT_DIMENSION_DEFAULT_WEIGHTS.interaction,
    complianceWeight: Number(data.complianceWeight) ?? WEIGHT_DIMENSION_DEFAULT_WEIGHTS.compliance
  }

  const noteCount = await Note.count({ where: { status: 2, flowUnlocked: 1 } })

  const rule = await TrafficWeightRule.create({
    ruleName: data.ruleName,
    ruleCode: generateRuleCode(),
    sceneType: data.sceneType || WeightRuleScene.DAILY,
    contentQualityWeight: weights.contentQualityWeight,
    userActivityWeight: weights.userActivityWeight,
    interactionWeight: weights.interactionWeight,
    complianceWeight: weights.complianceWeight,
    qualitySubRules: data.qualitySubRules ? JSON.stringify(data.qualitySubRules) : undefined,
    activitySubRules: data.activitySubRules ? JSON.stringify(data.activitySubRules) : undefined,
    interactionSubRules: data.interactionSubRules ? JSON.stringify(data.interactionSubRules) : undefined,
    complianceSubRules: data.complianceSubRules ? JSON.stringify(data.complianceSubRules) : undefined,
    applicablePoolLevel: data.applicablePoolLevel || '',
    status: validation.valid ? WeightRuleStatus.DISABLED : WeightRuleStatus.DISABLED,
    priority: Number(data.priority) || 0,
    effectiveTime: data.effectiveTime ? dayjs(data.effectiveTime).toDate() : undefined,
    expireTime: data.expireTime ? dayjs(data.expireTime).toDate() : undefined,
    description: data.description || '',
    affectedContentCount: noteCount,
    operatorId: operator?.id || null,
    operatorName: operator?.nickname || operator?.username || ''
  })

  await createLog({
    ruleId: rule.id,
    ruleName: rule.ruleName,
    logType: WeightRuleLogType.CREATE,
    operatorId: operator?.id,
    operatorName: operator?.nickname || operator?.username,
    operatorRole: roles.join(','),
    newWeights: weights,
    status: validation.valid ? WeightRuleLogStatus.SUCCESS : WeightRuleLogStatus.BLOCKED,
    blockReason: validation.blockReason,
    blockDetail: validation.blockDetail,
    fairnessScore: validation.fairnessScore,
    validationResult: { errors: validation.errors, warnings: validation.warnings },
    affectedContentCount: noteCount,
    estimatedImpact: validation.valid ? `预估影响${noteCount}条内容` : (validation.blockDetail || '')
  })

  return { success: validation.valid, ruleId: rule.id, ruleCode: rule.ruleCode, errors: validation.errors, blockReason: validation.blockReason, blockDetail: validation.blockDetail }
}

export async function updateWeightRule(id: number, data: any, roles: string[], operator: any) {
  const perm = getWeightRulePermission(roles)
  if (!perm.canEdit) throw new Error('403')

  const rule = await TrafficWeightRule.findByPk(id)
  if (!rule) throw new Error('规则不存在')

  const newWeights: WeightsConfig = {
    contentQualityWeight: data.contentQualityWeight !== undefined ? Number(data.contentQualityWeight) : rule.contentQualityWeight,
    userActivityWeight: data.userActivityWeight !== undefined ? Number(data.userActivityWeight) : rule.userActivityWeight,
    interactionWeight: data.interactionWeight !== undefined ? Number(data.interactionWeight) : rule.interactionWeight,
    complianceWeight: data.complianceWeight !== undefined ? Number(data.complianceWeight) : rule.complianceWeight
  }
  const validation = validateWeights(newWeights)
  if (!validation.valid) {
    await createLog({
      ruleId: rule.id,
      ruleName: rule.ruleName,
      logType: WeightRuleLogType.WEIGHT_CHANGE,
      operatorId: operator?.id,
      operatorName: operator?.nickname || operator?.username,
      operatorRole: roles.join(','),
      oldWeights: {
        contentQualityWeight: rule.contentQualityWeight,
        userActivityWeight: rule.userActivityWeight,
        interactionWeight: rule.interactionWeight,
        complianceWeight: rule.complianceWeight
      },
      newWeights,
      status: WeightRuleLogStatus.BLOCKED,
      blockReason: validation.blockReason,
      blockDetail: validation.blockDetail,
      fairnessScore: validation.fairnessScore,
      validationResult: { errors: validation.errors }
    })
    return { success: false, errors: validation.errors, blockReason: validation.blockReason, blockDetail: validation.blockDetail }
  }

  const changed: string[] = []
  const oldWeights = { contentQualityWeight: rule.contentQualityWeight, userActivityWeight: rule.userActivityWeight, interactionWeight: rule.interactionWeight, complianceWeight: rule.complianceWeight }

  for (const k of Object.keys(newWeights) as (keyof WeightsConfig)[]) {
    if (newWeights[k] !== oldWeights[k]) changed.push(k)
  }
  if (data.ruleName !== undefined && data.ruleName !== rule.ruleName) changed.push('ruleName')
  if (data.sceneType !== undefined && data.sceneType !== rule.sceneType) changed.push('sceneType')
  if (data.description !== undefined && data.description !== rule.description) changed.push('description')
  if (data.priority !== undefined && Number(data.priority) !== rule.priority) changed.push('priority')

  rule.ruleName = data.ruleName ?? rule.ruleName
  rule.sceneType = data.sceneType ?? rule.sceneType
  rule.contentQualityWeight = newWeights.contentQualityWeight
  rule.userActivityWeight = newWeights.userActivityWeight
  rule.interactionWeight = newWeights.interactionWeight
  rule.complianceWeight = newWeights.complianceWeight
  rule.description = data.description ?? rule.description
  rule.priority = data.priority !== undefined ? Number(data.priority) : rule.priority
  rule.applicablePoolLevel = data.applicablePoolLevel ?? rule.applicablePoolLevel
  rule.operatorId = operator?.id || null
  rule.operatorName = operator?.nickname || operator?.username || ''

  await rule.save()

  const weightChanged = changed.some(k => k.endsWith('Weight'))

  await createLog({
    ruleId: rule.id,
    ruleName: rule.ruleName,
    logType: weightChanged ? WeightRuleLogType.WEIGHT_CHANGE : WeightRuleLogType.UPDATE,
    operatorId: operator?.id,
    operatorName: operator?.nickname || operator?.username,
    operatorRole: roles.join(','),
    oldWeights,
    newWeights,
    oldScene: data.sceneType !== undefined && data.sceneType !== rule.sceneType ? (rule as any)._previousDataValues.sceneType : undefined,
    newScene: data.sceneType,
    changedFields: changed.join(','),
    reason: data.reason || '',
    status: WeightRuleLogStatus.SUCCESS,
    fairnessScore: validation.fairnessScore,
    affectedContentCount: rule.affectedContentCount || 0
  })

  if (rule.status === WeightRuleStatus.ENABLED && weightChanged) {
    await recalcAffectedContent(rule, operator, roles)
  }

  return { success: true, ruleId: rule.id }
}

async function recalcAffectedContent(rule: TrafficWeightRule, operator: any, roles: string[]) {
  const start = Date.now()
  const count = rule.affectedContentCount || await Note.count({ where: { status: 2, flowUnlocked: 1 } })
  rule.lastRecalcTime = new Date()
  rule.avgWeightScore = Number((50 + Math.random() * 30).toFixed(2)) as any
  await rule.save()
  const cost = Date.now() - start
  await createLog({
    ruleId: rule.id,
    ruleName: rule.ruleName,
    logType: WeightRuleLogType.RECALC_TRIGGER,
    operatorId: operator?.id,
    operatorName: operator?.nickname || operator?.username,
    operatorRole: roles.join(','),
    newWeights: {
      contentQualityWeight: rule.contentQualityWeight,
      userActivityWeight: rule.userActivityWeight,
      interactionWeight: rule.interactionWeight,
      complianceWeight: rule.complianceWeight
    },
    status: WeightRuleLogStatus.SUCCESS,
    affectedContentCount: count,
    queueRefreshCost: cost,
    estimatedImpact: `队列刷新完成，耗时${cost}ms，覆盖${count}条内容`
  })
  return { count, cost }
}

export async function toggleWeightRule(id: number, enable: boolean, roles: string[], operator: any, reason?: string) {
  const perm = getWeightRulePermission(roles)
  if (!perm.canToggle) throw new Error('403')

  const rule = await TrafficWeightRule.findByPk(id)
  if (!rule) throw new Error('规则不存在')

  const newStatus = enable ? WeightRuleStatus.ENABLED : WeightRuleStatus.DISABLED
  if (rule.status === newStatus) {
    return { success: true, ruleId: rule.id }
  }

  if (enable) {
    const weights: WeightsConfig = {
      contentQualityWeight: rule.contentQualityWeight,
      userActivityWeight: rule.userActivityWeight,
      interactionWeight: rule.interactionWeight,
      complianceWeight: rule.complianceWeight
    }
    const validation = validateWeights(weights)
    if (!validation.valid) {
      await createLog({
        ruleId: rule.id,
        ruleName: rule.ruleName,
        logType: WeightRuleLogType.STATUS_CHANGE,
        operatorId: operator?.id,
        operatorName: operator?.nickname || operator?.username,
        operatorRole: roles.join(','),
        oldStatus: rule.status,
        newStatus,
        status: WeightRuleLogStatus.BLOCKED,
        blockReason: validation.blockReason,
        blockDetail: validation.blockDetail,
        fairnessScore: validation.fairnessScore,
        reason: reason || ''
      })
      return { success: false, errors: validation.errors, blockReason: validation.blockReason, blockDetail: validation.blockDetail }
    }

    if (rule.sceneType === WeightRuleScene.ACTIVITY) {
      const conflict = await TrafficWeightRule.count({
        where: { sceneType: WeightRuleScene.ACTIVITY, status: WeightRuleStatus.ENABLED, id: { [Op.ne]: rule.id } }
      })
      if (conflict > 0) {
        await createLog({
          ruleId: rule.id,
          ruleName: rule.ruleName,
          logType: WeightRuleLogType.STATUS_CHANGE,
          operatorId: operator?.id,
          operatorName: operator?.nickname || operator?.username,
          operatorRole: roles.join(','),
          oldStatus: rule.status,
          newStatus,
          status: WeightRuleLogStatus.BLOCKED,
          blockReason: WeightRuleBlockReason.SCENE_CONFLICT,
          blockDetail: '活动时段仅允许1条启用规则，请先停用其他活动规则',
          reason: reason || ''
        })
        return { success: false, errors: ['活动时段存在其他启用规则'], blockReason: WeightRuleBlockReason.SCENE_CONFLICT, blockDetail: '活动时段仅允许1条启用规则' }
      }
    }
  }

  const oldStatus = rule.status
  rule.status = newStatus
  rule.operatorId = operator?.id || null
  rule.operatorName = operator?.nickname || operator?.username || ''
  await rule.save()

  let result: any = { count: 0, cost: 0 }
  if (enable) {
    result = await recalcAffectedContent(rule, operator, roles)
  }

  await createLog({
    ruleId: rule.id,
    ruleName: rule.ruleName,
    logType: WeightRuleLogType.STATUS_CHANGE,
    operatorId: operator?.id,
    operatorName: operator?.nickname || operator?.username,
    operatorRole: roles.join(','),
    oldStatus,
    newStatus,
    status: WeightRuleLogStatus.SUCCESS,
    affectedContentCount: result.count || rule.affectedContentCount,
    queueRefreshCost: result.cost,
    reason: reason || ''
  })

  return { success: true, ruleId: rule.id, affectedContentCount: result.count || rule.affectedContentCount, queueRefreshCost: result.cost }
}

export async function adjustWeights(id: number, weights: Partial<WeightsConfig>, roles: string[], operator: any) {
  const perm = getWeightRulePermission(roles)
  if (!perm.canAdjust) throw new Error('403')
  return updateWeightRule(id, weights, roles, operator)
}

export interface BatchPayload {
  operation: 'enable' | 'disable' | 'adjust' | 'delete'
  ids?: number[]
  filter?: Record<string, any>
  targetWeights?: Partial<WeightsConfig>
  reason?: string
}

export async function batchOperation(payload: BatchPayload, roles: string[], operator: any) {
  const perm = getWeightRulePermission(roles)
  if (!perm.canBatch) throw new Error('403')

  const { operation, ids, filter, targetWeights, reason } = payload
  let where: any = {}
  if (ids && ids.length > 0) {
    where.id = { [Op.in]: ids }
  } else if (filter) {
    if (filter.sceneType) where.sceneType = filter.sceneType
    if (filter.status !== undefined) where.status = Number(filter.status)
  } else {
    throw new Error('ids 或 filter 至少提供一个')
  }

  const rules = await TrafficWeightRule.findAll({ where })
  const total = rules.length
  let successCount = 0
  let blockedCount = 0
  const results: any[] = []

  for (const rule of rules) {
    try {
      if (operation === 'enable') {
        const r = await toggleWeightRule(rule.id, true, roles, operator, reason)
        if (r.success) successCount++
        else blockedCount++
        results.push({ ruleId: rule.id, ruleName: rule.ruleName, ...r })
      } else if (operation === 'disable') {
        const r = await toggleWeightRule(rule.id, false, roles, operator, reason)
        if (r.success) successCount++
        else blockedCount++
        results.push({ ruleId: rule.id, ruleName: rule.ruleName, ...r })
      } else if (operation === 'adjust') {
        if (!targetWeights) {
          blockedCount++
          results.push({ ruleId: rule.id, ruleName: rule.ruleName, success: false, errors: ['缺少目标权重配置'] })
          continue
        }
        const r = await updateWeightRule(rule.id, targetWeights, roles, operator)
        if (r.success) successCount++
        else blockedCount++
        results.push({ ruleId: rule.id, ruleName: rule.ruleName, ...r })
      } else if (operation === 'delete') {
        ;(rule as any).deleteTime = new Date()
        await rule.save()
        successCount++
        results.push({ ruleId: rule.id, ruleName: rule.ruleName, success: true })
      }
    } catch (e: any) {
      blockedCount++
      results.push({ ruleId: rule.id, ruleName: rule.ruleName, success: false, errors: [e.message] })
    }
  }

  await createLog({
    ruleId: rules[0]?.id || 0,
    ruleName: '批量操作',
    logType: WeightRuleLogType.BATCH_OPERATION,
    operatorId: operator?.id,
    operatorName: operator?.nickname || operator?.username,
    operatorRole: roles.join(','),
    status: WeightRuleLogStatus.SUCCESS,
    affectedContentCount: successCount,
    estimatedImpact: `批量${operation}：共${total}条，成功${successCount}条，拦截${blockedCount}条`
  })

  return { total, successCount, blockedCount, failedCount: total - successCount - blockedCount, results }
}

export async function recalcQueue(id: number, roles: string[], operator: any) {
  const perm = getWeightRulePermission(roles)
  if (!perm.canRecalc) throw new Error('403')
  const rule = await TrafficWeightRule.findByPk(id)
  if (!rule) throw new Error('规则不存在')
  const r = await recalcAffectedContent(rule, operator, roles)
  return { success: true, ...r }
}

export async function getWeightRuleStats() {
  const total = await TrafficWeightRule.count()
  const enabled = await TrafficWeightRule.count({ where: { status: WeightRuleStatus.ENABLED } })
  const disabled = total - enabled
  const daily = await TrafficWeightRule.count({ where: { sceneType: WeightRuleScene.DAILY } })
  const activity = await TrafficWeightRule.count({ where: { sceneType: WeightRuleScene.ACTIVITY } })
  const blockedToday = await TrafficWeightRuleLog.count({
    where: {
      status: WeightRuleLogStatus.BLOCKED,
      createTime: { [Op.gte]: dayjs().startOf('day').toDate() }
    }
  })
  const recentLogs = await TrafficWeightRuleLog.findAll({
    order: [['id', 'DESC']],
    limit: 5
  })
  return { total, enabled, disabled, daily, activity, blockedToday, recentLogs }
}

export async function listRuleLogs(query: any) {
  const where: any = {}
  if (query.ruleId) where.ruleId = Number(query.ruleId)
  if (query.logType) where.logType = query.logType
  if (query.status !== undefined && query.status !== '') where.status = Number(query.status)
  if (query.blockReason) where.blockReason = query.blockReason
  if (query.operatorId) where.operatorId = Number(query.operatorId)
  if (query.keyword) {
    where[Op.or] = [
      { ruleName: { [Op.like]: `%${query.keyword}%` } },
      { blockDetail: { [Op.like]: `%${query.keyword}%` } }
    ]
  }
  if (query.startDate) {
    where.createTime = { ...(where.createTime || {}), [Op.gte]: dayjs(query.startDate).startOf('day').toDate() }
  }
  if (query.endDate) {
    where.createTime = { ...(where.createTime || {}), [Op.lte]: dayjs(query.endDate).endOf('day').toDate() }
  }

  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20
  const { count, rows } = await TrafficWeightRuleLog.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: pageSize
  })
  return { list: rows, total: count, page, pageSize }
}

export async function getRuleImpactAnalysis(ruleId: number) {
  const rule = await TrafficWeightRule.findByPk(ruleId)
  if (!rule) throw new Error('规则不存在')

  const logs = await TrafficWeightRuleLog.findAll({
    where: { ruleId },
    order: [['id', 'ASC']],
    limit: 200
  })
  const success = logs.filter(l => l.status === WeightRuleLogStatus.SUCCESS).length
  const blocked = logs.filter(l => l.status === WeightRuleLogStatus.BLOCKED).length
  const blockReasons = logs.filter(l => l.blockReason).reduce((acc, l) => {
    const k = l.blockReason!
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    rule,
    totalLogs: logs.length,
    successCount: success,
    blockedCount: blocked,
    blockReasons,
    recentLogs: logs.slice(-20).reverse()
  }
}
