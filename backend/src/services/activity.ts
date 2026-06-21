import {
  Activity,
  ActivityAuditLog,
  ActivityTemplate
} from '@/models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import sequelize from '@config/database'
import {
  CampaignStatus,
  CAMPAIGN_STATUS_NAMES,
  CAMPAIGN_STATUS_COLORS,
  CampaignType,
  CAMPAIGN_TYPE_NAMES,
  CampaignScene,
  CAMPAIGN_SCENE_NAMES,
  ParticipationScopeType,
  PARTICIPATION_SCOPE_NAMES,
  REWARD_TYPE_NAMES,
  CampaignCheckDimension,
  CAMPAIGN_CHECK_DIMENSION_NAMES,
  CheckResultLevel,
  CHECK_RESULT_LEVEL_NAMES,
  CampaignAuditAction,
  CAMPAIGN_AUDIT_ACTION_NAMES,
  CAMPAIGN_VIOLATION_KEYWORDS,
  CAMPAIGN_REWARD_RATIO_LIMITS,
  USER_LEVEL_NAMES
} from '@/enums/business'

interface OperatorInfo {
  userId: number
  username: string
  roles: string[]
  permissions: string[]
  ip?: string
  userAgent?: string
}

interface ActivityRewardRule {
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
}

interface ActivityCreateData {
  name: string
  description?: string
  coverImage?: string
  type: string
  scenes?: string[]
  startTime: string | Date
  endTime: string | Date
  participantScopeType?: string
  participantScopeConfig?: Record<string, any>
  participantThreshold?: number
  maxParticipants?: number
  rewardRules?: ActivityRewardRule[]
  rewardBudget?: number
  rewardRatio?: number
  rules?: string
  templateId?: number
  priority?: number
  homePageDisplay?: number
  entryHighlightConfig?: Record<string, any>
  remark?: string
  operatorId?: number
  operatorName?: string
}

interface ActivityUpdateData extends Partial<ActivityCreateData> {
  status?: number
}

interface CheckResultItem {
  dimension: string
  dimensionName: string
  level: string
  levelName: string
  field?: string
  message: string
  detail?: any
  passed: boolean
}

interface BatchCreateItem extends ActivityCreateData {
  nameSuffix?: string
  startTimeOffset?: number
}

interface BatchUpdateItem {
  id: number
  updates: ActivityUpdateData
}

interface BatchToggleItem {
  id: number
  targetStatus: CampaignStatus
}

const safeJSONParse = <T = any>(str: string | null | undefined, defaultValue: T): T => {
  if (!str) return defaultValue
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
  return `BATCH_${ts}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

const computeChangedFields = (oldObj: Record<string, any>, newObj: Record<string, any>): string[] => {
  const fields: string[] = []
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
  for (const key of allKeys) {
    const oldVal = JSON.stringify(oldObj[key])
    const newVal = JSON.stringify(newObj[key])
    if (oldVal !== newVal) fields.push(key)
  }
  return fields
}

const activitySnapshot = (a: Activity): Record<string, any> => {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    type: a.type,
    scenes: safeJSONParse<any[]>(a.scenes, []),
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    participantScopeType: a.participantScopeType,
    participantScopeConfig: safeJSONParse(a.participantScopeConfig, {}),
    participantThreshold: a.participantThreshold,
    maxParticipants: a.maxParticipants,
    rewardRules: safeJSONParse<ActivityRewardRule[]>(a.rewardRules, []),
    rewardBudget: a.rewardBudget,
    rewardRatio: a.rewardRatio,
    rules: a.rules,
    templateId: a.templateId,
    priority: a.priority,
    homePageDisplay: a.homePageDisplay,
    entryHighlightConfig: safeJSONParse(a.entryHighlightConfig, {}),
    remark: a.remark
  }
}

const serializeActivityData = (data: any): any => {
  const out: any = { ...data }
  if (data.scenes !== undefined) out.scenes = JSON.stringify(data.scenes || [])
  if (data.participantScopeConfig !== undefined) out.participantScopeConfig = JSON.stringify(data.participantScopeConfig || {})
  if (data.rewardRules !== undefined) out.rewardRules = JSON.stringify(data.rewardRules || [])
  if (data.entryHighlightConfig !== undefined) out.entryHighlightConfig = JSON.stringify(data.entryHighlightConfig || {})
  if (data.checkResult !== undefined && typeof data.checkResult !== 'string') out.checkResult = JSON.stringify(data.checkResult)
  if (data.rewardRatio !== undefined) out.rewardRatio = Number(data.rewardRatio) || 0
  if (data.rewardBudget !== undefined) out.rewardBudget = Number(data.rewardBudget) || 0
  if (data.participantThreshold !== undefined) out.participantThreshold = Number(data.participantThreshold) || 0
  if (data.maxParticipants !== undefined) out.maxParticipants = Number(data.maxParticipants) || 0
  if (data.priority !== undefined) out.priority = Number(data.priority) || 0
  if (data.homePageDisplay !== undefined) out.homePageDisplay = Number(data.homePageDisplay) ? 1 : 0
  return out
}

const decorateActivity = (a: Activity): any => {
  const data = (a as any).toJSON ? (a as any).toJSON() : { ...a }
  data.statusName = CAMPAIGN_STATUS_NAMES[data.status ?? CampaignStatus.DRAFT] ?? ''
  data.statusColor = CAMPAIGN_STATUS_COLORS[data.status ?? CampaignStatus.DRAFT] ?? ''
  data.typeName = CAMPAIGN_TYPE_NAMES[data.type] ?? data.type
  data.scenes = safeJSONParse<string[]>(data.scenes, [])
  data.sceneNames = (data.scenes as string[]).map(s => CAMPAIGN_SCENE_NAMES[s] || s)
  data.participantScopeTypeName = PARTICIPATION_SCOPE_NAMES[data.participantScopeType] ?? data.participantScopeType
  data.participantScopeConfig = safeJSONParse(data.participantScopeConfig, {})
  data.rewardRules = safeJSONParse<ActivityRewardRule[]>(data.rewardRules, [])
  data.entryHighlightConfig = safeJSONParse(data.entryHighlightConfig, {})
  data.checkResult = safeJSONParse<CheckResultItem[]>(data.checkResult, [])
  return data
}

export const activityService = {
  // ==================== 公共辅助：审计日志 ====================
  async _writeAudit(params: {
    activityId: number
    activityName: string
    action: CampaignAuditAction
    operator: OperatorInfo
    oldData?: Record<string, any>
    newData?: Record<string, any>
    changedFields?: string[]
    checkDimension?: string
    checkLevel?: string
    checkMessage?: string
    batchId?: string
    remark?: string
  }): Promise<void> {
    await ActivityAuditLog.create({
      activityId: params.activityId,
      activityName: params.activityName,
      action: params.action,
      actionName: CAMPAIGN_AUDIT_ACTION_NAMES[params.action] || params.action,
      operatorId: params.operator.userId,
      operatorName: params.operator.username,
      oldData: params.oldData ? JSON.stringify(params.oldData) : undefined,
      newData: params.newData ? JSON.stringify(params.newData) : undefined,
      changedFields: params.changedFields ? JSON.stringify(params.changedFields) : undefined,
      checkDimension: params.checkDimension,
      checkLevel: params.checkLevel,
      checkMessage: params.checkMessage,
      ip: params.operator.ip,
      userAgent: params.operator.userAgent,
      batchId: params.batchId,
      remark: params.remark
    } as any)
  },

  // ==================== 功能点1：前置校验 ====================
  async validateActivity(
    data: ActivityCreateData & { id?: number },
    _operator: OperatorInfo
  ): Promise<{
    valid: boolean
    passed: boolean
    hasBlocker: boolean
    hasError: boolean
    results: CheckResultItem[]
    overlapActivities?: any[]
    fieldErrors?: Record<string, CheckResultItem[]>
  }> {
    const results: CheckResultItem[] = []
    const excludeId = data.id

    // ====== 维度1：配置完整性 ======
    const requiredFields: Array<{ key: keyof ActivityCreateData; label: string; type?: 'array' | 'string' }> = [
      { key: 'name', label: '活动名称' },
      { key: 'type', label: '活动类型' },
      { key: 'startTime', label: '活动开始时间' },
      { key: 'endTime', label: '活动结束时间' },
      { key: 'participantScopeType', label: '参与范围类型' },
      { key: 'rewardRules', label: '奖励规则', type: 'array' },
      { key: 'scenes', label: '适配场景', type: 'array' }
    ]

    for (const f of requiredFields) {
      const val = (data as any)[f.key]
      let missing = false
      if (f.type === 'array') {
        missing = !Array.isArray(val) || val.length === 0
      } else if (f.type === 'string') {
        missing = !val || String(val).trim() === ''
      } else {
        missing = val === undefined || val === null || (typeof val === 'string' && val.trim() === '')
      }
      if (missing) {
        results.push({
          dimension: CampaignCheckDimension.CONFIG_COMPLETE,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.CONFIG_COMPLETE],
          level: CheckResultLevel.ERROR,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
          field: f.key as string,
          message: `${f.label}不能为空`,
          passed: false
        })
      }
    }

    if (data.name && String(data.name).length > 200) {
      results.push({
        dimension: CampaignCheckDimension.CONFIG_COMPLETE,
        dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.CONFIG_COMPLETE],
        level: CheckResultLevel.ERROR,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
        field: 'name',
        message: '活动名称长度不能超过200字符',
        passed: false
      })
    }

    // ====== 维度2：时间适配性 + 时间重叠检测 ======
    const startTime = data.startTime ? new Date(data.startTime) : null
    const endTime = data.endTime ? new Date(data.endTime) : null

    if (startTime && endTime) {
      if (startTime >= endTime) {
        results.push({
          dimension: CampaignCheckDimension.TIME_FIT,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.TIME_FIT],
          level: CheckResultLevel.ERROR,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
          field: 'startTime',
          message: '活动开始时间必须早于结束时间',
          passed: false
        })
      }
      if (endTime.getTime() < Date.now()) {
        results.push({
          dimension: CampaignCheckDimension.TIME_FIT,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.TIME_FIT],
          level: CheckResultLevel.WARNING,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
          field: 'endTime',
          message: '活动结束时间已过，创建后将无法正常上线',
          passed: true
        })
      }

      // 时间重叠检测：同类型活动时段重叠
      if (data.type) {
        const overlapWhere: any = {
          type: data.type,
          status: { [Op.in]: [CampaignStatus.DRAFT, CampaignStatus.ONLINE] },
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gt]: startTime }
        }
        if (excludeId) overlapWhere.id = { [Op.ne]: excludeId }

        const overlapActivities = await Activity.findAll({
          where: overlapWhere,
          attributes: ['id', 'name', 'startTime', 'endTime', 'status', 'type']
        })

        if (overlapActivities.length > 0) {
          const overlapList = overlapActivities.map(a => ({
            id: a.id,
            name: a.name,
            startTime: a.startTime,
            endTime: a.endTime,
            status: a.status,
            statusName: CAMPAIGN_STATUS_NAMES[a.status]
          }))
          results.push({
            dimension: CampaignCheckDimension.TIME_FIT,
            dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.TIME_FIT],
            level: CheckResultLevel.BLOCKER,
            levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
            field: 'startTime',
            message: `检测到 ${overlapActivities.length} 个同类活动时段重叠，将被自动拦截创建/上线`,
            detail: overlapList,
            passed: false
          })
        }
      }
    }

    // ====== 维度3：参与门槛合理性 ======
    if (data.participantThreshold !== undefined && Number(data.participantThreshold) < 0) {
      results.push({
        dimension: CampaignCheckDimension.PARTICIPATION_THRESHOLD,
        dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.PARTICIPATION_THRESHOLD],
        level: CheckResultLevel.ERROR,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
        field: 'participantThreshold',
        message: '参与门槛不能为负数',
        passed: false
      })
    }
    if (data.maxParticipants !== undefined && Number(data.maxParticipants) < 0) {
      results.push({
        dimension: CampaignCheckDimension.PARTICIPATION_THRESHOLD,
        dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.PARTICIPATION_THRESHOLD],
        level: CheckResultLevel.ERROR,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
        field: 'maxParticipants',
        message: '最大参与人数不能为负数',
        passed: false
      })
    }
    if (
      data.maxParticipants !== undefined &&
      Number(data.maxParticipants) > 0 &&
      data.participantThreshold !== undefined &&
      Number(data.participantThreshold) > Number(data.maxParticipants)
    ) {
      results.push({
        dimension: CampaignCheckDimension.PARTICIPATION_THRESHOLD,
        dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.PARTICIPATION_THRESHOLD],
        level: CheckResultLevel.WARNING,
        levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
        field: 'participantThreshold',
        message: '参与门槛值大于最大参与人数，可能导致无用户符合条件',
        passed: true
      })
    }

    // ====== 维度4：奖励合规性 + 奖励配比 ======
    const rewardRules = data.rewardRules || []
    if (rewardRules.length > 0) {
      const typeLimits = CAMPAIGN_REWARD_RATIO_LIMITS[data.type] || CAMPAIGN_REWARD_RATIO_LIMITS[CampaignType.CUSTOM]
      let totalRewardAmount = 0
      for (let i = 0; i < rewardRules.length; i++) {
        const r = rewardRules[i]
        if (!r.name) {
          results.push({
            dimension: CampaignCheckDimension.REWARD_COMPLIANCE,
            dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.REWARD_COMPLIANCE],
            level: CheckResultLevel.ERROR,
            levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
            field: `rewardRules[${i}].name`,
            message: `奖励规则[${i + 1}]名称不能为空`,
            passed: false
          })
        }
        if (!r.rewardType || !REWARD_TYPE_NAMES[r.rewardType]) {
          results.push({
            dimension: CampaignCheckDimension.REWARD_COMPLIANCE,
            dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.REWARD_COMPLIANCE],
            level: CheckResultLevel.ERROR,
            levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
            field: `rewardRules[${i}].rewardType`,
            message: `奖励规则[${i + 1}]奖励类型无效`,
            passed: false
          })
        }
        if (r.rewardAmount === undefined || Number(r.rewardAmount) <= 0) {
          results.push({
            dimension: CampaignCheckDimension.REWARD_COMPLIANCE,
            dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.REWARD_COMPLIANCE],
            level: CheckResultLevel.ERROR,
            levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
            field: `rewardRules[${i}].rewardAmount`,
            message: `奖励规则[${i + 1}]奖励金额必须大于0`,
            passed: false
          })
        }
        if (r.probability !== undefined && (Number(r.probability) <= 0 || Number(r.probability) > 1)) {
          results.push({
            dimension: CampaignCheckDimension.REWARD_COMPLIANCE,
            dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.REWARD_COMPLIANCE],
            level: CheckResultLevel.ERROR,
            levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
            field: `rewardRules[${i}].probability`,
            message: `奖励规则[${i + 1}]中奖概率必须在(0,1]范围内`,
            passed: false
          })
        }
        totalRewardAmount += Number(r.rewardAmount) * (r.quota || 1)
      }

      const budget = Number(data.rewardBudget) || 0
      if (budget > 0 && totalRewardAmount > budget) {
        results.push({
          dimension: CampaignCheckDimension.REWARD_COMPLIANCE,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.REWARD_COMPLIANCE],
          level: CheckResultLevel.ERROR,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
          field: 'rewardBudget',
          message: `奖励规则总金额(${totalRewardAmount})超过预算(${budget})`,
          detail: { totalRewardAmount, budget },
          passed: false
        })
      }

      const ratio = data.rewardRatio !== undefined ? Number(data.rewardRatio) : (budget > 0 && totalRewardAmount > 0 ? totalRewardAmount / budget : 0)
      if (ratio < typeLimits.minRatio) {
        results.push({
          dimension: CampaignCheckDimension.REWARD_COMPLIANCE,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.REWARD_COMPLIANCE],
          level: CheckResultLevel.WARNING,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
          field: 'rewardRatio',
          message: `${CAMPAIGN_TYPE_NAMES[data.type] || data.type}类型活动奖励配比(${ratio})低于建议下限(${typeLimits.minRatio})，活动吸引力可能不足`,
          detail: { ratio, min: typeLimits.minRatio, max: typeLimits.maxRatio },
          passed: true
        })
      }
      if (ratio > typeLimits.maxRatio) {
        results.push({
          dimension: CampaignCheckDimension.REWARD_COMPLIANCE,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.REWARD_COMPLIANCE],
          level: CheckResultLevel.BLOCKER,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
          field: 'rewardRatio',
          message: `${CAMPAIGN_TYPE_NAMES[data.type] || data.type}类型活动奖励配比(${ratio})超过上限(${typeLimits.maxRatio})，存在营销异常风险`,
          detail: { ratio, min: typeLimits.minRatio, max: typeLimits.maxRatio },
          passed: false
        })
      }
      if (budget > typeLimits.maxAmount) {
        results.push({
          dimension: CampaignCheckDimension.REWARD_COMPLIANCE,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.REWARD_COMPLIANCE],
          level: CheckResultLevel.BLOCKER,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
          field: 'rewardBudget',
          message: `${CAMPAIGN_TYPE_NAMES[data.type] || data.type}类型活动单场预算(${budget})超过上限(${typeLimits.maxAmount})`,
          passed: false
        })
      }
    }

    // ====== 维度5：重复性检测 ======
    if (data.name) {
      const dupWhere: any = {
        name: data.name
      }
      if (excludeId) dupWhere.id = { [Op.ne]: excludeId }
      const dupCount = await Activity.count({ where: dupWhere })
      if (dupCount > 0) {
        results.push({
          dimension: CampaignCheckDimension.DUPLICATE,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.DUPLICATE],
          level: CheckResultLevel.ERROR,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
          field: 'name',
          message: `已存在相同名称的活动（${dupCount}个），请修改名称或确认是否为重复活动`,
          detail: { dupCount },
          passed: false
        })
      }
    }

    // ====== 维度6：违规营销关键词 ======
    const textToCheck = [data.name, data.description, data.rules, ...(rewardRules.map(r => r.name + ' ' + (r.description || '')))].join(' ')
    for (const kw of CAMPAIGN_VIOLATION_KEYWORDS) {
      if (textToCheck.includes(kw)) {
        results.push({
          dimension: CampaignCheckDimension.VIOLATION,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.VIOLATION],
          level: CheckResultLevel.BLOCKER,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.BLOCKER],
          field: 'description',
          message: `检测到违规营销关键词："${kw}"，涉嫌违反广告法相关规定`,
          passed: false
        })
      }
    }

    // ====== 维度7：规则合理性 ======
    if (data.scenes && Array.isArray(data.scenes)) {
      if (data.scenes.includes(CampaignScene.PRODUCT_DETAIL) && (!data.type || data.type === CampaignType.SIGN_IN)) {
        results.push({
          dimension: CampaignCheckDimension.RULE_RATIONALITY,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.RULE_RATIONALITY],
          level: CheckResultLevel.WARNING,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
          field: 'scenes',
          message: '签到类型活动在商品详情页展示可能效果不佳，建议调整适配场景',
          passed: true
        })
      }
      if (data.scenes.includes(CampaignScene.NEW_USER) && data.participantScopeType && data.participantScopeType !== ParticipationScopeType.NEW_USERS && data.participantScopeType !== ParticipationScopeType.ALL_USERS) {
        results.push({
          dimension: CampaignCheckDimension.RULE_RATIONALITY,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.RULE_RATIONALITY],
          level: CheckResultLevel.WARNING,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.WARNING],
          field: 'scenes',
          message: '选择了新用户场景，但参与范围类型与新用户不匹配',
          passed: true
        })
      }
    }
    if (data.participantScopeType === ParticipationScopeType.USER_LEVEL) {
      const scopeConfig = (data.participantScopeConfig || {}) as any
      const levels = scopeConfig.levels || []
      if (levels.length === 0) {
        results.push({
          dimension: CampaignCheckDimension.RULE_RATIONALITY,
          dimensionName: CAMPAIGN_CHECK_DIMENSION_NAMES[CampaignCheckDimension.RULE_RATIONALITY],
          level: CheckResultLevel.ERROR,
          levelName: CHECK_RESULT_LEVEL_NAMES[CheckResultLevel.ERROR],
          field: 'participantScopeConfig',
          message: '选择了"按用户等级"参与范围，但未指定具体等级列表',
          passed: false
        })
      }
    }

    const hasBlocker = results.some(r => r.level === CheckResultLevel.BLOCKER)
    const hasError = results.some(r => r.level === CheckResultLevel.ERROR || r.level === CheckResultLevel.BLOCKER)
    const passed = !hasError
    const valid = !hasBlocker

    const overlapItem = results.find(r => r.dimension === CampaignCheckDimension.TIME_FIT && r.detail && Array.isArray(r.detail))
    const overlapActivities = overlapItem?.detail

    const fieldErrors: Record<string, CheckResultItem[]> = {}
    for (const r of results) {
      if (r.field && !r.passed) {
        if (!fieldErrors[r.field]) fieldErrors[r.field] = []
        fieldErrors[r.field].push(r)
      }
    }

    return { valid, passed, hasBlocker, hasError, results, overlapActivities, fieldErrors }
  },

  // ==================== 基础 CRUD + 校验集成 ====================
  async list(params: {
    page: number
    pageSize: number
    keyword?: string
    type?: string
    status?: number
    scenes?: string
    participantScopeType?: string
    homePageDisplay?: number
    templateId?: number
    operatorId?: number
    startTimeFrom?: string
    startTimeTo?: string
  }) {
    const { page, pageSize, keyword, type, status, scenes, participantScopeType, homePageDisplay, templateId, operatorId, startTimeFrom, startTimeTo } = params
    const where: any = {}

    if (keyword) where.name = { [Op.like]: `%${keyword}%` }
    if (type) where.type = type
    if (status !== undefined) where.status = status
    if (scenes) where.scenes = { [Op.like]: `%${scenes}%` }
    if (participantScopeType) where.participantScopeType = participantScopeType
    if (homePageDisplay !== undefined) where.homePageDisplay = homePageDisplay
    if (templateId !== undefined) where.templateId = templateId
    if (operatorId !== undefined) where.operatorId = operatorId
    if (startTimeFrom) where.startTime = { ...(where.startTime || {}), [Op.gte]: new Date(startTimeFrom) }
    if (startTimeTo) where.startTime = { ...(where.startTime || {}), [Op.lte]: new Date(startTimeTo) }

    const { count, rows } = await Activity.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['priority', 'DESC'], ['create_time', 'DESC']]
    })

    const list = rows.map(r => decorateActivity(r))
    return { list, total: count, page, pageSize }
  },

  async detail(id: number) {
    const activity = await Activity.findByPk(id, {
      include: [{ association: 'auditLogs', separate: true, limit: 50, order: [['createTime', 'DESC']] }]
    })
    if (!activity) throw new AppError('活动不存在', 404)
    const data = decorateActivity(activity)
    data.auditLogs = (activity as any).auditLogs ? ((activity as any).auditLogs as any[]).map((l: any) => {
      const d = l.toJSON ? l.toJSON() : { ...l }
      d.oldData = safeJSONParse(d.oldData, null)
      d.newData = safeJSONParse(d.newData, null)
      d.changedFields = safeJSONParse<string[]>(d.changedFields, [])
      return d
    }) : []
    return data
  },

  async create(data: ActivityCreateData, operator: OperatorInfo, options: { force?: boolean; skipAudit?: boolean } = {}) {
    // Step 1: 前置校验
    const validation = await this.validateActivity(data, operator)
    if (!options.force && validation.hasBlocker) {
      const blocker = validation.results.find(r => r.level === CheckResultLevel.BLOCKER)
      if (blocker) {
        throw new AppError(`活动校验不通过：${blocker.message}`, 422)
      }
    }
    if (!options.force && validation.hasError && !validation.hasBlocker) {
      const firstError = validation.results.find(r => r.level === CheckResultLevel.ERROR)
      if (firstError) {
        throw new AppError(`活动参数错误：${firstError.message}`, 422)
      }
    }

    const t = await sequelize.transaction()
    try {
      const serialized = serializeActivityData({
        ...data,
        status: CampaignStatus.DRAFT,
        checkResult: JSON.stringify(validation.results),
        checkPassed: validation.passed ? 1 : 0,
        participantCount: 0,
        rewardCost: 0,
        operatorId: operator.userId,
        operatorName: operator.username
      } as any)

      const activity = await Activity.create(serialized, { transaction: t } as any) as unknown as Activity

      // 如果使用了模板，累计使用次数
      if (data.templateId) {
        await ActivityTemplate.increment('useCount', { by: 1, where: { id: data.templateId }, transaction: t })
      }

      await t.commit()

      // 写入审计日志
      if (!options.skipAudit) {
        await this._writeAudit({
          activityId: activity.id,
          activityName: activity.name,
          action: CampaignAuditAction.CREATED,
          operator,
          newData: activitySnapshot(activity),
          changedFields: Object.keys(serialized),
          remark: options.force ? '强制创建（绕过阻断校验）' : undefined
        })
      }

      return {
        id: activity.id,
        validation: {
          valid: validation.valid,
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
  },

  async update(id: number, data: ActivityUpdateData, operator: OperatorInfo, options: { force?: boolean; skipAudit?: boolean } = {}) {
    const activity = await Activity.findByPk(id)
    if (!activity) throw new AppError('活动不存在', 404)

    const oldSnapshot = activitySnapshot(activity)

    // 合并新旧数据用于校验
    const merged: any = {
      ...oldSnapshot,
      ...data,
      id
    }
    const validation = await this.validateActivity(merged, operator)
    if (!options.force && validation.hasBlocker) {
      const blocker = validation.results.find(r => r.level === CheckResultLevel.BLOCKER)
      if (blocker) {
        throw new AppError(`活动校验不通过：${blocker.message}`, 422)
      }
    }

    const t = await sequelize.transaction()
    try {
      const serialized = serializeActivityData({
        ...data,
        checkResult: JSON.stringify(validation.results),
        checkPassed: validation.passed ? 1 : 0,
        operatorId: operator.userId,
        operatorName: operator.username
      })

      await activity.update(serialized, { transaction: t } as any)

      await t.commit()

      const newSnapshot = activitySnapshot(activity)
      const changedFields = computeChangedFields(oldSnapshot, newSnapshot)

      if (!options.skipAudit && changedFields.length > 0) {
        let action = CampaignAuditAction.UPDATED
        if (changedFields.includes('status')) action = CampaignAuditAction.STATUS_CHANGED
        else if (changedFields.some(f => f.startsWith('reward'))) action = CampaignAuditAction.REWARD_CHANGED
        else if (changedFields.some(f => f.startsWith('participant'))) action = CampaignAuditAction.PARTICIPATION_CHANGED
        else if (changedFields.some(f => ['scenes', 'rules', 'priority', 'homePageDisplay'].includes(f))) action = CampaignAuditAction.CONFIG_CHANGED

        await this._writeAudit({
          activityId: activity.id,
          activityName: activity.name,
          action,
          operator,
          oldData: oldSnapshot,
          newData: newSnapshot,
          changedFields,
          remark: options.force ? '强制修改（绕过阻断校验）' : undefined
        })
      }

      return {
        id: activity.id,
        changedFields,
        validation: {
          valid: validation.valid,
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
  },

  async remove(id: number, operator: OperatorInfo) {
    const activity = await Activity.findByPk(id)
    if (!activity) throw new AppError('活动不存在', 404)
    if (activity.status === CampaignStatus.ONLINE) {
      throw new AppError('上线状态的活动无法直接删除，请先下线后再删除', 400)
    }
    await activity.destroy()
    await this._writeAudit({
      activityId: id,
      activityName: activity.name,
      action: CampaignAuditAction.STATUS_CHANGED,
      operator,
      oldData: activitySnapshot(activity),
      remark: '活动删除'
    })
    return true
  },

  // ==================== 功能点2：状态管理（草稿/上线/下线） ====================
  async changeStatus(
    id: number,
    targetStatus: CampaignStatus,
    operator: OperatorInfo,
    options: { force?: boolean; remark?: string } = {}
  ): Promise<{
    id: number
    previousStatus: number
    targetStatus: number
    validated: boolean
    checkResults?: CheckResultItem[]
    blockedReasons?: CheckResultItem[]
  }> {
    const activity = await Activity.findByPk(id)
    if (!activity) throw new AppError('活动不存在', 404)

    const previousStatus = activity.status

    // 状态流转合法性
    const allowedTransitions: Record<number, number[]> = {
      [CampaignStatus.DRAFT]: [CampaignStatus.ONLINE, CampaignStatus.CANCELLED],
      [CampaignStatus.ONLINE]: [CampaignStatus.OFFLINE, CampaignStatus.DRAFT],
      [CampaignStatus.OFFLINE]: [CampaignStatus.ONLINE, CampaignStatus.CANCELLED],
      [CampaignStatus.CANCELLED]: []
    }
    if (!allowedTransitions[previousStatus]?.includes(targetStatus)) {
      throw new AppError(`无法从${CAMPAIGN_STATUS_NAMES[previousStatus]}状态变更为${CAMPAIGN_STATUS_NAMES[targetStatus]}`, 400)
    }

    let checkResults: CheckResultItem[] = []
    let blockedReasons: CheckResultItem[] = []

    // 上线时必须执行严格校验（多维度拦截）
    if (targetStatus === CampaignStatus.ONLINE) {
      const snapshot = activitySnapshot(activity)
      const validation = await this.validateActivity({ ...snapshot, id } as any, operator)
      checkResults = validation.results
      blockedReasons = validation.results.filter(r => r.level === CheckResultLevel.BLOCKER || r.level === CheckResultLevel.ERROR)

      if (!options.force && !validation.passed) {
        // 写入拦截审计日志
        for (const blocker of blockedReasons) {
          await this._writeAudit({
            activityId: id,
            activityName: activity.name,
            action: CampaignAuditAction.LAUNCH_BLOCKED,
            operator,
            checkDimension: blocker.dimension,
            checkLevel: blocker.level,
            checkMessage: blocker.message,
            remark: options.remark || '上线校验被自动拦截'
          })
        }
        throw new AppError(`活动上线被拦截，共${blockedReasons.length}项问题待修复。首项：${blockedReasons[0]?.message}`, 422)
      }
    }

    const t = await sequelize.transaction()
    try {
      const updates: any = {
        status: targetStatus,
        operatorId: operator.userId,
        operatorName: operator.username,
        checkResult: JSON.stringify(checkResults),
        checkPassed: targetStatus === CampaignStatus.ONLINE ? 1 : activity.checkPassed
      }
      if (targetStatus === CampaignStatus.ONLINE) {
        updates.onlineTime = new Date()
        // 如果之前已下线，清除下线时间
        if (previousStatus === CampaignStatus.OFFLINE) updates.offlineTime = null
        // 状态联动：首页展示同步
        if (!options.force && activity.homePageDisplay !== 1) {
          // 保持原值，不强制修改
        }
      }
      if (targetStatus === CampaignStatus.OFFLINE) {
        updates.offlineTime = new Date()
      }
      if (targetStatus === CampaignStatus.DRAFT && previousStatus === CampaignStatus.ONLINE) {
        updates.offlineTime = new Date()
      }

      await activity.update(updates, { transaction: t } as any)
      await t.commit()

      await this._writeAudit({
        activityId: id,
        activityName: activity.name,
        action: options.force && targetStatus === CampaignStatus.ONLINE ? CampaignAuditAction.FORCE_LAUNCHED : CampaignAuditAction.STATUS_CHANGED,
        operator,
        oldData: { status: previousStatus },
        newData: { status: targetStatus, ...updates },
        changedFields: Object.keys(updates),
        remark: (options.remark || '') + (options.force ? ' [强制上线]' : '')
      })

      return {
        id,
        previousStatus,
        targetStatus,
        validated: checkResults.length === 0 || checkResults.every(r => r.passed),
        checkResults,
        blockedReasons
      }
    } catch (error) {
      try { await t.rollback() } catch { /* ignore */ }
      throw error
    }
  },

  // 活动首页展示列表（功能点2：草稿不展示/上线开放/下线关闭）
  async getHomePageDisplayList(options: { page?: number; pageSize?: number } = {}) {
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 20
    const now = new Date()
    const { count, rows } = await Activity.findAndCountAll({
      where: {
        status: CampaignStatus.ONLINE,
        homePageDisplay: 1,
        startTime: { [Op.lte]: now },
        endTime: { [Op.gte]: now }
      },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['priority', 'DESC'], ['onlineTime', 'DESC']]
    })
    return { list: rows.map(r => decorateActivity(r)), total: count, page, pageSize }
  },

  // 活动入口检查（功能点2：入口状态实时高亮）
  async getCampaignEntryInfo(id: number, userId?: number): Promise<{
    id: number
    name: string
    type: string
    status: number
    statusName: string
    entryOpen: boolean
    entryHighlight: boolean
    highlightConfig: any
    participantEligible?: boolean
    reason?: string
  }> {
    const activity = await Activity.findByPk(id)
    if (!activity) throw new AppError('活动不存在', 404)

    const now = new Date()
    const entryOpen = activity.status === CampaignStatus.ONLINE && activity.startTime <= now && activity.endTime >= now

    const highlightConfig = safeJSONParse<Record<string, any>>(activity.entryHighlightConfig, {})
    const entryHighlight = activity.status === CampaignStatus.ONLINE && Boolean(highlightConfig.enabled)

    let participantEligible = true
    let reason: string | undefined
    if (entryOpen && userId) {
      const scope = activity.participantScopeType
      const scopeCfg = safeJSONParse<Record<string, any>>(activity.participantScopeConfig, {})
      if (scope === ParticipationScopeType.SPECIFIC_USERS) {
        const userIds = (scopeCfg.userIds || []) as number[]
        participantEligible = userIds.includes(userId)
        if (!participantEligible) reason = '您不在本次活动指定参与用户范围内'
      } else if (scope === ParticipationScopeType.NEW_USERS) {
        const daysLimit = scopeCfg.daysLimit || 7
        // 这里仅返回配置，实际用户注册时间需要结合 user 表
        participantEligible = true
        reason = `新注册${daysLimit}天内用户可参与`
      } else if (scope === ParticipationScopeType.USER_LEVEL) {
        const levels = (scopeCfg.levels || []) as number[]
        // 实际校验需要 user 表，此处返回需要的等级
        participantEligible = true
        reason = `仅限用户等级 [${levels.map(l => USER_LEVEL_NAMES[l as number] || l).join('/')}] 参与`
      }
    } else if (activity.status !== CampaignStatus.ONLINE) {
      reason = `活动当前状态：${CAMPAIGN_STATUS_NAMES[activity.status]}`
    } else if (activity.startTime > now) {
      reason = '活动尚未开始'
    } else if (activity.endTime < now) {
      reason = '活动已结束'
    }

    return {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      status: activity.status,
      statusName: CAMPAIGN_STATUS_NAMES[activity.status],
      entryOpen,
      entryHighlight,
      highlightConfig,
      participantEligible,
      reason
    }
  },

  // ==================== 功能点3：批量操作 ====================
  // 批量创建（基于模板或自定义配置差异化）
  async batchCreate(
    batchItems: BatchCreateItem[],
    operator: OperatorInfo,
    options: { confirmCode?: string; templateId?: number; force?: boolean } = {}
  ): Promise<{
    batchId: string
    total: number
    success: number
    fail: number
    results: Array<{ index: number; name?: string; success: boolean; id?: number; error?: string }>
  }> {
    const batchId = genBatchId()
    const results: Array<{ index: number; name?: string; success: boolean; id?: number; error?: string }> = []
    let successCount = 0
    let failCount = 0

    // 如果基于模板，获取模板基础配置
    let templateBase: Partial<ActivityCreateData> = {}
    if (options.templateId) {
      const template = await ActivityTemplate.findByPk(options.templateId)
      if (!template) throw new AppError('指定的活动模板不存在', 404)
      templateBase = {
        type: template.type,
        scenes: safeJSONParse<string[]>(template.scenes, []),
        description: template.description,
        coverImage: template.coverImage,
        participantScopeType: template.participantScopeType,
        participantScopeConfig: safeJSONParse(template.participantScopeConfig, {}),
        participantThreshold: template.participantThreshold,
        maxParticipants: template.maxParticipants,
        rewardRules: safeJSONParse<ActivityRewardRule[]>(template.rewardRules, []),
        rewardBudget: Number(template.rewardBudget) || 0,
        rewardRatio: Number(template.rewardRatio) || 0,
        rules: template.rules,
        priority: template.priority,
        homePageDisplay: template.homePageDisplay,
        entryHighlightConfig: safeJSONParse(template.entryHighlightConfig, {}),
        templateId: template.id
      }
    }

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i]
      try {
        // 差异化配置：按用户群体配置门槛
        const mergedData: ActivityCreateData = {
          ...templateBase,
          ...item,
          scenes: item.scenes || templateBase.scenes || [],
          name: (templateBase.name ? templateBase.name + ' ' : '') + (item.name || '') + (item.nameSuffix || ''),
          startTime: item.startTimeOffset
            ? new Date(new Date(item.startTime || Date.now()).getTime() + item.startTimeOffset * 24 * 3600 * 1000)
            : item.startTime,
          endTime: item.endTime || (item.startTimeOffset && item.startTime
            ? new Date(new Date(item.startTime).getTime() + ((templateBase as any).durationDays || 7 + item.startTimeOffset) * 24 * 3600 * 1000)
            : item.endTime),
          participantScopeConfig: {
            ...(templateBase.participantScopeConfig || {}),
            ...(item.participantScopeConfig || {})
          } as any
        } as ActivityCreateData

        const createResult = await this.create(mergedData, { ...operator }, { force: options.force, skipAudit: true })
        results.push({ index: i, name: mergedData.name, success: true, id: createResult.id })
        successCount++

        // 批量创建的每条记录都写入审计（携带 batchId）
        const act = await Activity.findByPk(createResult.id)
        if (act) {
          await this._writeAudit({
            activityId: act.id,
            activityName: act.name,
            action: CampaignAuditAction.BATCH_CREATED,
            operator,
            newData: activitySnapshot(act),
            batchId,
            remark: `批量创建 #${i + 1}/${batchItems.length}`
          })
        }
      } catch (err: any) {
        failCount++
        results.push({ index: i, name: item.name, success: false, error: err.message || '创建失败' })
      }
    }

    return { batchId, total: batchItems.length, success: successCount, fail: failCount, results }
  },

  // 批量修改（差异化配置）
  async batchUpdate(
    updateItems: BatchUpdateItem[],
    operator: OperatorInfo,
    options: { confirmCode?: string; force?: boolean } = {}
  ): Promise<{
    batchId: string
    total: number
    success: number
    fail: number
    results: Array<{ index: number; id: number; success: boolean; changedFields?: string[]; error?: string }>
  }> {
    const batchId = genBatchId()
    const results: Array<{ index: number; id: number; success: boolean; changedFields?: string[]; error?: string }> = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < updateItems.length; i++) {
      const item = updateItems[i]
      try {
        const res = await this.update(item.id, item.updates, operator, { force: options.force, skipAudit: true })
        results.push({ index: i, id: item.id, success: true, changedFields: res.changedFields })
        successCount++

        await this._writeAudit({
          activityId: item.id,
          activityName: (await Activity.findByPk(item.id))?.name || '',
          action: CampaignAuditAction.BATCH_UPDATED,
          operator,
          changedFields: res.changedFields,
          batchId,
          remark: `批量修改 #${i + 1}/${updateItems.length}`
        })
      } catch (err: any) {
        failCount++
        results.push({ index: i, id: item.id, success: false, error: err.message || '修改失败' })
      }
    }

    return { batchId, total: updateItems.length, success: successCount, fail: failCount, results }
  },

  // 批量启停（针对时段重叠活动或选定活动）
  async batchToggle(
    toggleItems: BatchToggleItem[],
    operator: OperatorInfo,
    options: { confirmCode?: string; force?: boolean; remark?: string } = {}
  ): Promise<{
    batchId: string
    total: number
    success: number
    fail: number
    results: Array<{
      index: number
      id: number
      name?: string
      targetStatus: number
      success: boolean
      previousStatus?: number
      error?: string
    }>
  }> {
    const batchId = genBatchId()
    const results: Array<{
      index: number
      id: number
      name?: string
      targetStatus: number
      success: boolean
      previousStatus?: number
      error?: string
    }> = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < toggleItems.length; i++) {
      const item = toggleItems[i]
      const activity = await Activity.findByPk(item.id)
      try {
        const res = await this.changeStatus(item.id, item.targetStatus, operator, { force: options.force, remark: options.remark })
        results.push({
          index: i,
          id: item.id,
          name: activity?.name,
          targetStatus: item.targetStatus,
          success: true,
          previousStatus: res.previousStatus
        })
        successCount++

        await this._writeAudit({
          activityId: item.id,
          activityName: activity?.name || '',
          action: CampaignAuditAction.BATCH_TOGGLED,
          operator,
          oldData: { status: res.previousStatus },
          newData: { status: res.targetStatus },
          batchId,
          remark: `批量启停 #${i + 1}/${toggleItems.length} -> ${CAMPAIGN_STATUS_NAMES[item.targetStatus]}`
        })
      } catch (err: any) {
        failCount++
        results.push({
          index: i,
          id: item.id,
          name: activity?.name,
          targetStatus: item.targetStatus,
          success: false,
          error: err.message || '状态变更失败'
        })
      }
    }

    return { batchId, total: toggleItems.length, success: successCount, fail: failCount, results }
  },

  // 检测时段重叠活动（辅助批量启停）
  async findOverlappingActivities(
    type: string,
    startTime: string | Date,
    endTime: string | Date,
    excludeId?: number
  ): Promise<any[]> {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const where: any = {
      type,
      status: { [Op.in]: [CampaignStatus.DRAFT, CampaignStatus.ONLINE] },
      startTime: { [Op.lt]: end },
      endTime: { [Op.gt]: start }
    }
    if (excludeId) where.id = { [Op.ne]: excludeId }

    const list = await Activity.findAll({ where })
    return list.map(r => decorateActivity(r))
  },

  // ==================== 功能点4：溯源与拦截日志 ====================
  async getAuditLogs(
    params: {
      page: number
      pageSize: number
      activityId?: number
      action?: string
      operatorId?: number
      batchId?: string
      checkLevel?: string
      startTime?: string
      endTime?: string
    }
  ): Promise<{ list: any[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, activityId, action, operatorId, batchId, checkLevel, startTime, endTime } = params
    const where: any = {}
    if (activityId !== undefined) where.activityId = activityId
    if (action) where.action = action
    if (operatorId !== undefined) where.operatorId = operatorId
    if (batchId) where.batchId = batchId
    if (checkLevel) where.checkLevel = checkLevel
    if (startTime) where.createTime = { ...(where.createTime || {}), [Op.gte]: new Date(startTime) }
    if (endTime) where.createTime = { ...(where.createTime || {}), [Op.lte]: new Date(endTime) }

    const { count, rows } = await ActivityAuditLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createTime', 'DESC']]
    })

    const list = rows.map((l: any) => {
      const d = l.toJSON()
      d.oldData = safeJSONParse(d.oldData, null)
      d.newData = safeJSONParse(d.newData, null)
      d.changedFields = safeJSONParse<string[]>(d.changedFields, [])
      d.actionName = CAMPAIGN_AUDIT_ACTION_NAMES[d.action] || d.action
      if (d.checkDimension) d.checkDimensionName = CAMPAIGN_CHECK_DIMENSION_NAMES[d.checkDimension] || d.checkDimension
      if (d.checkLevel) d.checkLevelName = CHECK_RESULT_LEVEL_NAMES[d.checkLevel] || d.checkLevel
      return d
    })

    return { list, total: count, page, pageSize }
  },

  // 获取单次活动配置溯源快照（双击查看）
  async getActivityTraceSnapshot(id: number, auditLogId?: number): Promise<{
    current: any
    history?: any
    diff?: Array<{ field: string; oldValue: any; newValue: any }>
    auditLogs: any[]
  }> {
    const activity = await Activity.findByPk(id)
    if (!activity) throw new AppError('活动不存在', 404)
    const current = activitySnapshot(activity)

    const logs = await ActivityAuditLog.findAll({
      where: { activityId: id },
      order: [['createTime', 'DESC']],
      limit: 100
    })
    const auditLogs = logs.map(l => {
      const d = (l as any).toJSON()
      d.oldData = safeJSONParse(d.oldData, null)
      d.newData = safeJSONParse(d.newData, null)
      d.changedFields = safeJSONParse<string[]>(d.changedFields, [])
      d.actionName = CAMPAIGN_AUDIT_ACTION_NAMES[d.action] || d.action
      return d
    })

    let history: any = undefined
    let diff: Array<{ field: string; oldValue: any; newValue: any }> | undefined

    if (auditLogId) {
      const targetLog = logs.find(l => l.id === auditLogId)
      if (targetLog) {
        history = safeJSONParse(targetLog.oldData, null) || safeJSONParse(targetLog.newData, null)
        if (history) {
          diff = []
          const allFields = new Set([...Object.keys(current), ...Object.keys(history)])
          for (const f of allFields) {
            const oldVal = history[f]
            const newVal = current[f]
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              diff.push({ field: f, oldValue: oldVal, newValue: newVal })
            }
          }
        }
      }
    }

    return { current, history, diff, auditLogs }
  },

  // 获取拦截统计（功能点4）
  async getBlockadeStats(_operator?: OperatorInfo): Promise<{
    totalBlocked: number
    byDimension: Record<string, number>
    byLevel: Record<string, number>
    recentBlocked: any[]
  }> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000)
    const blockedLogs = await ActivityAuditLog.findAll({
      where: {
        action: CampaignAuditAction.LAUNCH_BLOCKED,
        createTime: { [Op.gte]: sevenDaysAgo }
      },
      order: [['createTime', 'DESC']],
      limit: 100
    })

    const byDimension: Record<string, number> = {}
    const byLevel: Record<string, number> = {}
    for (const l of blockedLogs) {
      const dim = l.checkDimension || 'unknown'
      const lv = l.checkLevel || 'unknown'
      byDimension[dim] = (byDimension[dim] || 0) + 1
      byLevel[lv] = (byLevel[lv] || 0) + 1
    }

    const recentBlocked = blockedLogs.slice(0, 20).map(l => {
      const d = (l as any).toJSON()
      if (d.checkDimension) d.checkDimensionName = CAMPAIGN_CHECK_DIMENSION_NAMES[d.checkDimension] || d.checkDimension
      if (d.checkLevel) d.checkLevelName = CHECK_RESULT_LEVEL_NAMES[d.checkLevel] || d.checkLevel
      return d
    })

    return {
      totalBlocked: blockedLogs.length,
      byDimension,
      byLevel,
      recentBlocked
    }
  },

  // ==================== 活动模板管理 ====================
  async listTemplates(params: {
    page: number
    pageSize: number
    keyword?: string
    type?: string
    status?: number
  }) {
    const { page, pageSize, keyword, type, status } = params
    const where: any = {}
    if (keyword) where.name = { [Op.like]: `%${keyword}%` }
    if (type) where.type = type
    if (status !== undefined) where.status = status

    const { count, rows } = await ActivityTemplate.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    const list = rows.map((t: any) => {
      const d = t.toJSON()
      d.typeName = CAMPAIGN_TYPE_NAMES[d.type] || d.type
      d.scenes = safeJSONParse<string[]>(d.scenes, [])
      d.participantScopeConfig = safeJSONParse(d.participantScopeConfig, {})
      d.rewardRules = safeJSONParse<ActivityRewardRule[]>(d.rewardRules, [])
      d.entryHighlightConfig = safeJSONParse(d.entryHighlightConfig, {})
      return d
    })

    return { list, total: count, page, pageSize }
  },

  async createTemplate(data: Partial<ActivityCreateData> & { durationDays?: number }, operator: OperatorInfo) {
    const serialized = serializeActivityData({
      ...data,
      status: 1,
      useCount: 0,
      creatorId: operator.userId,
      creatorName: operator.username
    } as any)
    const tpl = await ActivityTemplate.create(serialized as any)
    return { id: tpl.id }
  },

  async updateTemplate(id: number, data: Partial<ActivityCreateData> & { status?: number; durationDays?: number }, operator: OperatorInfo) {
    const tpl = await ActivityTemplate.findByPk(id)
    if (!tpl) throw new AppError('模板不存在', 404)
    const serialized = serializeActivityData({
      ...data,
      creatorId: operator.userId,
      creatorName: operator.username
    })
    await tpl.update(serialized as any)
    return { id: tpl.id }
  },

  async deleteTemplate(id: number) {
    const tpl = await ActivityTemplate.findByPk(id)
    if (!tpl) throw new AppError('模板不存在', 404)
    await tpl.destroy()
    return true
  },

  async getTemplateDetail(id: number) {
    const tpl = await ActivityTemplate.findByPk(id)
    if (!tpl) throw new AppError('模板不存在', 404)
    const d = (tpl as any).toJSON()
    d.typeName = CAMPAIGN_TYPE_NAMES[d.type] || d.type
    d.scenes = safeJSONParse<string[]>(d.scenes, [])
    d.participantScopeConfig = safeJSONParse(d.participantScopeConfig, {})
    d.rewardRules = safeJSONParse<ActivityRewardRule[]>(d.rewardRules, [])
    d.entryHighlightConfig = safeJSONParse(d.entryHighlightConfig, {})
    return d
  }
}
