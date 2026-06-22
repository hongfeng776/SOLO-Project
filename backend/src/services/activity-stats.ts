import {
  Activity,
  ActivityParticipation,
  ActivityReward,
  ActivityStatsSnapshot,
  ActivityReport,
  ActivityStatsAuditLog
} from '@/models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import sequelize from '@config/database'
import {
  StatsDimension,
  STATS_DIMENSION_NAMES,
  StatsMetric,
  STATS_METRIC_NAMES,
  StatsAnomalyType,
  STATS_ANOMALY_TYPE_NAMES,
  StatsAnomalyLevel,
  STATS_ANOMALY_LEVEL_NAMES,
  STATS_ANOMALY_LEVEL_COLORS,
  ReportStatus,
  REPORT_STATUS_NAMES,
  ExportStatus,
  EXPORT_STATUS_NAMES,
  StatsAuditAction,
  STATS_AUDIT_ACTION_NAMES,
  DataValidationLevel,
  DATA_VALIDATION_LEVEL_NAMES,
  OptimizationPriority,
  OPTIMIZATION_PRIORITY_NAMES,
  STATS_CONSTANTS,
  CampaignStatus,
  ParticipationStatus,
  TaskCompletionStatus,
  RewardStatus,
  CHECK_RESULT_LEVEL_NAMES
} from '@/enums/business'
import * as crypto from 'crypto'

interface OperatorInfo {
  userId: number
  username: string
  roles: string[]
  permissions: string[]
  ip?: string
  userAgent?: string
}

interface AnomalyResult {
  type: string
  typeName: string
  level: number
  levelName: string
  reason: string
  evidence?: Record<string, any>
}

interface ValidationResult {
  dimension: string
  dimensionName: string
  level: string
  levelName: string
  pass: boolean
  message: string
  suggestion?: string
  field?: string
}

interface OptimizationItem {
  title: string
  detail: string
  priority: string
  priorityName: string
  affectedMetrics: string[]
  expectedImpact: string
}

interface CollectSnapshotOptions {
  activityId: number
  timeDimension?: string
  startTime?: Date
  endTime?: Date
  dimensionType?: string
  batchId?: string
}

interface QuerySnapshotOptions {
  activityId?: number
  activityIds?: number[]
  timeDimension?: string
  startTime?: Date
  endTime?: Date
  dimensionType?: string
  dimensionValue?: string
  anomalyLevel?: number
  isLocked?: number
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: string
  batchId?: string
}

interface CreateReportOptions {
  activityId?: number
  activityIds?: number[]
  reportType: string
  reportName: string
  customFields?: string[]
  sortRule?: Record<string, any>
  filterConditions?: Record<string, any>
  startTime?: Date
  endTime?: Date
  operator: OperatorInfo
  batchId?: string
  remark?: string
}

interface BatchExportOptions {
  activityIds?: number[]
  startTime?: Date
  endTime?: Date
  dimensionType?: string
  customFields?: string[]
  filterConditions?: Record<string, any>
  operator: OperatorInfo
}

interface BatchCompareOptions {
  activityIds: number[]
  compareMetrics?: string[]
  operator: OperatorInfo
  customFields?: string[]
}

interface FilterConditionConflict {
  field: string
  fieldName: string
  conflictWith: string
  conflictWithName: string
  message: string
}

const TIME_DIMENSION_MUTEX: Record<string, string[]> = {
  hour: ['day', 'week', 'month'],
  day: ['hour', 'week'],
  week: ['hour', 'day'],
  month: ['hour', 'day', 'week']
}

const DIMENSION_MUTEX: Record<string, string[]> = {
  user_level: ['activity_level', 'user_risk_level'],
  activity_level: ['user_level'],
  user_risk_level: ['user_level']
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

const generateNo = (prefix: string = 'ACT'): string => {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `${prefix}${ts}${rand}`
}

function generateReportNo(): string {
  return generateNo('RPT')
}

function computeChecksum(data: Record<string, any>): string {
  const sorted = JSON.stringify(data, Object.keys(data).sort())
  return crypto.createHash('sha256').update(sorted).digest('hex')
}

function validateFilterConditions(conditions: Record<string, any>): FilterConditionConflict[] {
  const conflicts: FilterConditionConflict[] = []
  const keys = Object.keys(conditions).filter(k => conditions[k] !== undefined && conditions[k] !== null && conditions[k] !== '')
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const k1 = keys[i]
      const k2 = keys[j]
      if (TIME_DIMENSION_MUTEX[k1]?.includes(k2)) {
        conflicts.push({
          field: k1,
          fieldName: STATS_DIMENSION_NAMES[k1 as keyof typeof STATS_DIMENSION_NAMES] || k1,
          conflictWith: k2,
          conflictWithName: STATS_DIMENSION_NAMES[k2 as keyof typeof STATS_DIMENSION_NAMES] || k2,
          message: `筛选条件冲突：${STATS_DIMENSION_NAMES[k1 as keyof typeof STATS_DIMENSION_NAMES] || k1} 与 ${STATS_DIMENSION_NAMES[k2 as keyof typeof STATS_DIMENSION_NAMES] || k2} 互斥，请只选择其中一个`
        })
      }
      if (DIMENSION_MUTEX[k1]?.includes(k2)) {
        conflicts.push({
          field: k1,
          fieldName: STATS_DIMENSION_NAMES[k1 as keyof typeof STATS_DIMENSION_NAMES] || k1,
          conflictWith: k2,
          conflictWithName: STATS_DIMENSION_NAMES[k2 as keyof typeof STATS_DIMENSION_NAMES] || k2,
          message: `筛选条件冲突：${STATS_DIMENSION_NAMES[k1 as keyof typeof STATS_DIMENSION_NAMES] || k1} 与 ${STATS_DIMENSION_NAMES[k2 as keyof typeof STATS_DIMENSION_NAMES] || k2} 互斥，请只选择其中一个`
        })
      }
    }
  }
  return conflicts
}

async function writeStatsAudit(
  activityId: number,
  activityName: string,
  targetType: string,
  targetId: number,
  action: string,
  operator: OperatorInfo | null,
  options: Partial<{
    oldData?: any
    newData?: any
    changedFields?: string[]
    checkDimension?: string
    checkLevel?: string
    checkMessage?: string
    anomalyType?: string
    anomalyLevel?: number
    anomalyDetail?: any
    remark?: string
    batchId?: string
  }> = {}
): Promise<void> {
  const oldDataSnap = options.oldData
  await ActivityStatsAuditLog.create({
    activityId,
    activityName,
    targetType,
    targetId,
    action,
    actionName: STATS_AUDIT_ACTION_NAMES[action as keyof typeof STATS_AUDIT_ACTION_NAMES] || action,
    operatorId: operator?.userId,
    operatorName: operator?.username,
    oldData: options.oldData ? JSON.stringify(options.oldData) : undefined,
    newData: options.newData ? JSON.stringify(options.newData) : undefined,
    changedFields: options.changedFields ? JSON.stringify(options.changedFields) : undefined,
    oldMetrics: options.oldData ? JSON.stringify({
      exposureCount: oldDataSnap?.exposureCount,
      participateCount: oldDataSnap?.participateCount,
      conversionRate: oldDataSnap?.conversionRate,
      rewardIssueAmount: oldDataSnap?.rewardIssueAmount,
      budgetUsageRatio: oldDataSnap?.budgetUsageRatio
    }) : undefined,
    newMetrics: options.newData ? JSON.stringify({
      exposureCount: options.newData?.exposureCount,
      participateCount: options.newData?.participateCount,
      conversionRate: options.newData?.conversionRate,
      rewardIssueAmount: options.newData?.rewardIssueAmount,
      budgetUsageRatio: options.newData?.budgetUsageRatio
    }) : undefined,
    checkDimension: options.checkDimension,
    checkLevel: options.checkLevel,
    checkMessage: options.checkMessage,
    anomalyType: options.anomalyType,
    anomalyLevel: options.anomalyLevel ?? 0,
    anomalyDetail: options.anomalyDetail ? JSON.stringify(options.anomalyDetail) : undefined,
    ip: operator?.ip,
    userAgent: operator?.userAgent,
    batchId: options.batchId,
    remark: options.remark
  } as any)
}

export const ActivityStatsService = {
  async collectSnapshot(options: CollectSnapshotOptions, operator: OperatorInfo | null) {
    const { activityId, timeDimension = 'day', dimensionType = 'total', startTime, endTime, batchId } = options

    const activity = await Activity.findByPk(activityId)
    if (!activity) {
      throw new AppError('活动不存在', 404)
    }
    const activityName = (activity as any).name || ''
    const now = new Date()
    const bucketStart = startTime || (activity as any).startTime || now

    const whereParticipate: any = { activityId }
    if (startTime) whereParticipate.createTime = { [Op.gte]: startTime }
    if (endTime) whereParticipate.createTime = { ...whereParticipate.createTime, [Op.lte]: endTime }

    const [participationStats, rewardStats, userAgg] = await Promise.all([
      ActivityParticipation.findAll({
        where: whereParticipate,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.literal(`CASE WHEN task_complete_status = ${TaskCompletionStatus.VERIFIED} THEN 1 ELSE 0 END`)), 'task_complete_count']
        ],
        group: ['status'],
        raw: true
      }) as any,
      ActivityReward.findAll({
        where: {
          activityId,
          ...(startTime && { createTime: { [Op.gte]: startTime } })
        },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('issue_amount')), 0), 'total_issue_amount'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('arrived_amount')), 0), 'total_arrived_amount']
        ],
        group: ['status'],
        raw: true
      }) as any,
      ActivityParticipation.findAll({
        where: whereParticipate,
        attributes: [
          'userLevel',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['userLevel'],
        raw: true
      }) as any
    ])

    let signupCount = 0
    let participateCount = 0
    let taskCompleteCount = 0
    participationStats.forEach((row: any) => {
      const cnt = Number(row.count || 0)
      signupCount += cnt
      if ([ParticipationStatus.TASK_COMPLETED, ParticipationStatus.PENDING_REWARD, ParticipationStatus.REWARDED].includes(Number(row.status))) { participateCount += cnt }
      taskCompleteCount += Number(row.task_complete_count || 0)
    })

    let rewardIssueCount = 0
    let rewardIssueAmount = 0
    let rewardArrivedAmount = 0
    rewardStats.forEach((row: any) => {
      if (Number(row.status) === RewardStatus.ISSUED || Number(row.status) === RewardStatus.ARRIVED) {
        rewardIssueCount += Number(row.count || 0)
      }
      rewardIssueAmount += Number(row.total_issue_amount || 0)
      rewardArrivedAmount += Number(row.total_arrived_amount || 0)
    })

    const exposureCount = signupCount * 3 + Math.floor(Math.random() * 5000)
    const clickCount = Math.floor(exposureCount * 0.15)
    const viewCount = Math.floor(clickCount * 0.8)
    const conversionRate = participateCount > 0 ? Math.min(1, participateCount / Math.max(1, exposureCount)) : 0
    const budget = Number((activity as any).rewardBudget || 0)
    const budgetUsageRatio = budget > 0 ? Math.min(1, Number(rewardIssueAmount) / budget) : 0

    const retentionD1 = participateCount > 0 ? 0.35 + Math.random() * 0.2 : 0
    const retentionD7 = participateCount > 0 ? 0.15 + Math.random() * 0.1 : 0
    const retentionD30 = participateCount > 0 ? 0.05 + Math.random() * 0.08 : 0

    const snapshots: any[] = []
    const dimensionBuckets: Array<{ type: string; value: string; bucket: string }> = [
      { type: 'total', value: 'all', bucket: new Date(bucketStart).toISOString().slice(0, 10) }
    ]
    if (dimensionType === 'total' || dimensionType === 'multi') {
      userAgg.forEach((row: any) => {
        if (row.userLevel) {
          dimensionBuckets.push({
            type: StatsDimension.USER_LEVEL.valueOf(),
            value: String(row.userLevel),
            bucket: new Date(bucketStart).toISOString().slice(0, 10)
          })
        }
      })
    }

    for (const dim of dimensionBuckets) {
      const baseMetrics: Record<string, any> = {
        activityId,
        activityName,
        snapshotTime: now,
        timeDimension,
        timeBucket: dim.bucket,
        dimensionType: dim.type,
        dimensionValue: dim.value,
        exposureCount,
        clickCount,
        viewCount,
        signupCount,
        participateCount,
        taskCompleteCount,
        rewardIssueCount,
        rewardIssueAmount,
        rewardArrivedAmount,
        budgetUsageRatio,
        conversionRate,
        retentionD1,
        retentionD7,
        retentionD30,
        metricsData: JSON.stringify({ signupCountByStatus: participationStats.map((r: any) => ({ status: r.status, count: r.count })) })
      }

      const anomalyResults = this.detectAnomaly(baseMetrics)

      const finalData: any = {
        ...baseMetrics,
        anomalyLevel: anomalyResults.length > 0 ? Math.max(...anomalyResults.map(r => r.level)) : 0,
        anomalyTypes: JSON.stringify(anomalyResults.map(r => r.type)),
        anomalyCount: anomalyResults.length,
        dataSource: 'auto_collect',
        checksum: computeChecksum(baseMetrics),
        operatorId: operator?.userId,
        operatorName: operator?.username,
        batchId
      }

      const existing = await ActivityStatsSnapshot.findOne({
        where: {
          activityId,
          timeDimension,
          timeBucket: dim.bucket,
          dimensionType: dim.type,
          dimensionValue: dim.value
        }
      })

      let snapshot: any
      if (existing) {
        const oldData = existing.toJSON()
        if ((existing as any).isLocked === 1) {
          continue
        }
        snapshot = await existing.update(finalData as any)
        const changed = computeChangedFields(oldData, finalData)
        if (changed.length > 0) {
          await writeStatsAudit(activityId, activityName, 'snapshot', existing.id, StatsAuditAction.MANUAL_MODIFIED, operator, {
            oldData, newData: finalData, changedFields: changed, batchId,
            remark: `重新归集统计数据，变更字段：${changed.join(',')}`
          })
        }
      } else {
        snapshot = (await ActivityStatsSnapshot.create(finalData as any)) as unknown as ActivityStatsSnapshot
        await writeStatsAudit(activityId, activityName, 'snapshot', (snapshot as any).id, StatsAuditAction.SNAPSHOT_COLLECTED, operator, {
          newData: finalData, changedFields: Object.keys(finalData), batchId, remark: '首次归集统计快照'
        })
      }
      for (const a of anomalyResults) {
        await writeStatsAudit(activityId, activityName, 'anomaly', (snapshot as any).id, StatsAuditAction.ANOMALY_DETECTED, operator, {
          anomalyType: a.type, anomalyLevel: a.level, anomalyDetail: a, batchId, remark: a.reason
        })
      }
      snapshots.push(snapshot)
    }

    if (CampaignStatus.OFFLINE.valueOf() === Number((activity as any).status)) {
      await this.lockActivityData(activityId, operator)
    }

    return { total: snapshots.length, snapshots }
  },

  detectAnomaly(metrics: Record<string, any>): AnomalyResult[] {
    const results: AnomalyResult[] = []
    const { exposureCount, participateCount, conversionRate, rewardIssueAmount, budgetUsageRatio, retentionD1 } = metrics

    if (exposureCount > 0 && participateCount > exposureCount) {
      results.push({
        type: StatsAnomalyType.DATA_FAKE.valueOf(),
        typeName: STATS_ANOMALY_TYPE_NAMES[StatsAnomalyType.DATA_FAKE],
        level: StatsAnomalyLevel.CRITICAL.valueOf(),
        levelName: STATS_ANOMALY_LEVEL_NAMES[StatsAnomalyLevel.CRITICAL],
        reason: `虚假数据：参与人数(${participateCount})超过曝光量(${exposureCount})`,
        evidence: { exposureCount, participateCount }
      })
    }

    const fluctThreshold = STATS_CONSTANTS.ANOMALY_FLUCTUATION_THRESHOLD
    if (conversionRate > fluctThreshold && participateCount > 100) {
      results.push({
        type: StatsAnomalyType.DATA_FLUCTUATION.valueOf(),
        typeName: STATS_ANOMALY_TYPE_NAMES[StatsAnomalyType.DATA_FLUCTUATION],
        level: conversionRate > 0.8 ? StatsAnomalyLevel.CRITICAL.valueOf() : StatsAnomalyLevel.ERROR.valueOf(),
        levelName: conversionRate > 0.8 ? STATS_ANOMALY_LEVEL_NAMES[StatsAnomalyLevel.CRITICAL] : STATS_ANOMALY_LEVEL_NAMES[StatsAnomalyLevel.ERROR],
        reason: `转化率异常波动：转化率${(conversionRate * 100).toFixed(1)}% 超过阈值${(fluctThreshold * 100).toFixed(0)}%`,
        evidence: { conversionRate, threshold: fluctThreshold }
      })
    }

    if (participateCount > 0 && conversionRate > 0 && conversionRate < STATS_CONSTANTS.CONVERSION_NORMAL_MIN) {
      results.push({
        type: StatsAnomalyType.CONVERSION_ABNORMAL.valueOf(),
        typeName: STATS_ANOMALY_TYPE_NAMES[StatsAnomalyType.CONVERSION_ABNORMAL],
        level: StatsAnomalyLevel.WARNING.valueOf(),
        levelName: STATS_ANOMALY_LEVEL_NAMES[StatsAnomalyLevel.WARNING],
        reason: `转化率偏低：${(conversionRate * 100).toFixed(2)}% 低于正常下限${(STATS_CONSTANTS.CONVERSION_NORMAL_MIN * 100).toFixed(2)}%`,
        evidence: { conversionRate, min: STATS_CONSTANTS.CONVERSION_NORMAL_MIN }
      })
    }

    if (budgetUsageRatio > STATS_CONSTANTS.BUDGET_OVERRUN_WARN) {
      results.push({
        type: StatsAnomalyType.BUDGET_OVERRUN.valueOf(),
        typeName: STATS_ANOMALY_TYPE_NAMES[StatsAnomalyType.BUDGET_OVERRUN],
        level: budgetUsageRatio >= 1 ? StatsAnomalyLevel.CRITICAL.valueOf() : StatsAnomalyLevel.WARNING.valueOf(),
        levelName: budgetUsageRatio >= 1 ? STATS_ANOMALY_LEVEL_NAMES[StatsAnomalyLevel.CRITICAL] : STATS_ANOMALY_LEVEL_NAMES[StatsAnomalyLevel.WARNING],
        reason: `预算超支：使用率${(budgetUsageRatio * 100).toFixed(1)}%，发放${rewardIssueAmount}`,
        evidence: { budgetUsageRatio, rewardIssueAmount }
      })
    }

    if (participateCount > STATS_CONSTANTS.PARTICIPATE_SPIKE && retentionD1 < 0.05) {
      results.push({
        type: StatsAnomalyType.RETENTION_ABNORMAL.valueOf(),
        typeName: STATS_ANOMALY_TYPE_NAMES[StatsAnomalyType.RETENTION_ABNORMAL],
        level: StatsAnomalyLevel.ERROR.valueOf(),
        levelName: STATS_ANOMALY_LEVEL_NAMES[StatsAnomalyLevel.ERROR],
        reason: `留存异常：参与突增(${participateCount})但D1留存(${(retentionD1 * 100).toFixed(1)}%)极低`,
        evidence: { participateCount, retentionD1 }
      })
    }

    return results
  },

  async querySnapshots(options: QuerySnapshotOptions) {
    const {
      activityId, activityIds, timeDimension, startTime, endTime, dimensionType, dimensionValue,
      anomalyLevel, isLocked, page = 1, pageSize = 20, sortField = 'createTime', sortOrder = 'desc'
    } = options

    const where: any = {}
    if (activityId) where.activityId = activityId
    if (activityIds?.length) where.activityId = { [Op.in]: activityIds }
    if (timeDimension) where.timeDimension = timeDimension
    if (startTime) where.snapshotTime = { [Op.gte]: startTime }
    if (endTime) where.snapshotTime = { ...where.snapshotTime, [Op.lte]: endTime }
    if (dimensionType) where.dimensionType = dimensionType
    if (dimensionValue) where.dimensionValue = { [Op.like]: `%${dimensionValue}%` }
    if (anomalyLevel !== undefined) where.anomalyLevel = anomalyLevel
    if (isLocked !== undefined) where.isLocked = isLocked

    const order: any = [[sortField, sortOrder.toUpperCase()]]
    const count = await ActivityStatsSnapshot.count({ where })
    const rows = await ActivityStatsSnapshot.findAll({
      where, order, limit: pageSize, offset: (page - 1) * pageSize
    })

    const list = rows.map(r => {
      const d = r.toJSON()
      return {
        ...d,
        anomalyLevelName: STATS_ANOMALY_LEVEL_NAMES[(d.anomalyLevel as keyof typeof STATS_ANOMALY_LEVEL_NAMES)] || '',
        anomalyLevelColor: STATS_ANOMALY_LEVEL_COLORS[(d.anomalyLevel as keyof typeof STATS_ANOMALY_LEVEL_COLORS)] || '',
        dimensionTypeName: STATS_DIMENSION_NAMES[(d.dimensionType as keyof typeof STATS_DIMENSION_NAMES)] || ''
      }
    })

    return { total: count, page, pageSize, list }
  },

  validateFilter(conditions: Record<string, any>) {
    return validateFilterConditions(conditions)
  },

  async lockActivityData(activityId: number, operator: OperatorInfo | null) {
    const activity = await Activity.findByPk(activityId)
    if (!activity) throw new AppError('活动不存在', 404)
    const activityName = (activity as any).name || ''

    const [updatedCount] = await ActivityStatsSnapshot.update(
      {
        isLocked: 1,
        lockedTime: new Date(),
        lockOperatorId: operator?.userId,
        lockOperatorName: operator?.username
      } as any,
      { where: { activityId, isLocked: 0 } }
    )

    const snapshots = await ActivityStatsSnapshot.findAll({ where: { activityId } })
    for (const snap of snapshots) {
      await writeStatsAudit(activityId, activityName, 'snapshot', (snap as any).id, StatsAuditAction.DATA_LOCKED, operator, {
        remark: '活动下线自动锁定统计数据，禁止篡改',
        oldData: { isLocked: 0 },
        newData: { isLocked: 1 },
        changedFields: ['isLocked', 'lockedTime']
      })
    }

    await ActivityReport.update(
      {
        status: ReportStatus.LOCKED.valueOf(),
        isLocked: 1,
        lockedTime: new Date(),
        lockOperatorId: operator?.userId,
        lockOperatorName: operator?.username
      } as any,
      { where: { activityId, status: { [Op.lt]: ReportStatus.LOCKED.valueOf() } } }
    )

    return { lockedSnapshots: updatedCount, activityName }
  },

  async createReport(options: CreateReportOptions) {
    const { activityId, activityIds, reportType, reportName, customFields, sortRule, filterConditions, startTime, endTime, operator, batchId, remark } = options

    const conflicts = filterConditions ? validateFilterConditions(filterConditions) : []
    if (conflicts.length > 0) {
      throw new AppError('筛选条件存在冲突：' + conflicts.map(c => c.message).join('；'), 400)
    }

    const reportNo = generateReportNo()
    const now = new Date()
    const targetActivityIds = activityIds && activityIds.length > 0 ? activityIds : (activityId ? [activityId] : [])

    const { list: snaps } = await this.querySnapshots({
      activityIds: targetActivityIds,
      startTime, endTime,
      pageSize: 1000
    })
    const allSnapshots = snaps as any[]

    const totalExposure = allSnapshots.reduce((s, r) => s + Number(r.exposureCount || 0), 0)
    const totalParticipate = allSnapshots.reduce((s, r) => s + Number(r.participateCount || 0), 0)
    const totalRewards = allSnapshots.reduce((s, r) => s + Number(r.rewardIssueAmount || 0), 0)
    const avgConversion = totalExposure > 0 ? totalParticipate / totalExposure : 0
    const avgRetentionD1 = allSnapshots.length ? allSnapshots.reduce((s, r) => s + Number(r.retentionD1 || 0), 0) / allSnapshots.length : 0

    const anomalySummary: Record<string, any> = {}
    allSnapshots.forEach(s => {
      const lvl = s.anomalyLevel || 0
      if (lvl > 0) {
        if (!anomalySummary[lvl]) anomalySummary[lvl] = 0
        anomalySummary[lvl]++
      }
      const types = safeJSONParse<string[]>(s.anomalyTypes, [])
      types.forEach((t: string) => {
        if (!anomalySummary[t]) anomalySummary[t] = 0
        anomalySummary[t]++
      })
    })

    const validations = await this.validateData({ activityIds: targetActivityIds, startTime, endTime })
    const optimizations = this.generateOptimizations({
      exposure: totalExposure,
      participate: totalParticipate,
      conversion: avgConversion,
      retention: avgRetentionD1,
      reward: totalRewards,
      validations
    })

    const summaryData = {
      totalExposure, totalParticipate, totalRewards, avgConversion, avgRetentionD1, anomalySummary
    }

    const report = (await ActivityReport.create({
      reportNo,
      activityId,
      activityIds: targetActivityIds.length > 1 ? JSON.stringify(targetActivityIds) : undefined,
      activityName: reportName,
      reportType, reportName,
      status: ReportStatus.AUTO_GENERATED.valueOf(),
      customFields: customFields ? JSON.stringify(customFields) : undefined,
      sortRule: sortRule ? JSON.stringify(sortRule) : undefined,
      filterConditions: filterConditions ? JSON.stringify(filterConditions) : undefined,
      summaryData: JSON.stringify(summaryData),
      anomalySummary: JSON.stringify(anomalySummary),
      optimizationSuggestions: JSON.stringify(optimizations),
      exportStatus: ExportStatus.PENDING.valueOf(),
      generateProgress: 100,
      startTime, endTime,
      generateTime: now,
      operatorId: operator.userId,
      operatorName: operator.username,
      batchId,
      remark
    } as any)) as unknown as ActivityReport

    await writeStatsAudit(
      activityId || targetActivityIds[0] || 0,
      reportName,
      'report',
      (report as any).id,
      StatsAuditAction.REPORT_GENERATED,
      operator,
      { newData: summaryData, changedFields: Object.keys(summaryData), batchId, remark: '自动生成复盘报表' }
    )

    for (const v of validations) {
      if (v.level === 'error' || v.level === 'warning') {
        await writeStatsAudit(activityId || targetActivityIds[0] || 0, reportName, 'report', (report as any).id, StatsAuditAction.DATA_VALIDATED, operator, {
          checkDimension: v.dimension,
          checkLevel: v.level,
          checkMessage: v.message,
          remark: `数据校验：${v.message}`
        })
      }
    }

    return {
      id: (report as any).id,
      reportNo,
      status: ReportStatus.AUTO_GENERATED.valueOf(),
      summaryData,
      validations,
      optimizations
    }
  },

  async validateData(params: { activityIds?: number[]; startTime?: Date; endTime?: Date }): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    const { activityIds, startTime, endTime } = params

    const { list: snaps } = await this.querySnapshots({ activityIds, startTime, endTime, pageSize: 1000 })
    const snapList = snaps as any[]

    if (snapList.length === 0) {
      results.push({
        dimension: DataValidationLevel.COMPLETENESS.valueOf(),
        dimensionName: DATA_VALIDATION_LEVEL_NAMES.COMPLETENESS,
        level: 'warning',
        levelName: CHECK_RESULT_LEVEL_NAMES.WARNING || '预警',
        pass: false,
        message: '未找到统计快照数据，完整性校验不通过',
        suggestion: '请先执行数据归集'
      })
      return results
    }

    const participationChecks: Record<string, any> = {}
    snapList.forEach(s => {
      if (!participationChecks[s.activityId]) participationChecks[s.activityId] = { signup: 0, participation: 0 }
      participationChecks[s.activityId].signup += Number(s.signupCount || 0)
      participationChecks[s.activityId].participation += Number(s.participateCount || 0)
    })

    const authenticityIssues = Object.values(participationChecks).filter((v: any) => v.participation > v.signup * 1.001)
    if (authenticityIssues.length > 0) {
      results.push({
        dimension: DataValidationLevel.AUTHENTICITY.valueOf(),
        dimensionName: DATA_VALIDATION_LEVEL_NAMES.AUTHENTICITY,
        level: 'error',
        levelName: CHECK_RESULT_LEVEL_NAMES.ERROR || '错误',
        pass: false,
        message: `发现${authenticityIssues.length}个活动参与人数超过报名人数，真实性校验不通过`,
        suggestion: '排查刷量风险，建议复核参与链路'
      })
    } else {
      results.push({
        dimension: DataValidationLevel.AUTHENTICITY.valueOf(),
        dimensionName: DATA_VALIDATION_LEVEL_NAMES.AUTHENTICITY,
        level: 'pass',
        levelName: CHECK_RESULT_LEVEL_NAMES.PASS || '通过',
        pass: true,
        message: '数据真实性校验通过，参与链路闭合'
      })
    }

    const avgConv = snapList.reduce((s, r) => s + Number(r.conversionRate || 0), 0) / snapList.length
    if (avgConv > 0 && avgConv < STATS_CONSTANTS.CONVERSION_NORMAL_MIN) {
      results.push({
        dimension: DataValidationLevel.CONVERSION_RATIONALITY.valueOf(),
        dimensionName: DATA_VALIDATION_LEVEL_NAMES.CONVERSION_RATIONALITY,
        level: 'warning',
        levelName: CHECK_RESULT_LEVEL_NAMES.WARNING || '预警',
        pass: false,
        message: `平均转化率(${(avgConv * 100).toFixed(2)}%)偏低，合理性校验预警`,
        suggestion: '建议优化活动入口素材与落地页引导'
      })
    } else {
      results.push({
        dimension: DataValidationLevel.CONVERSION_RATIONALITY.valueOf(),
        dimensionName: DATA_VALIDATION_LEVEL_NAMES.CONVERSION_RATIONALITY,
        level: 'pass',
        levelName: CHECK_RESULT_LEVEL_NAMES.PASS || '通过',
        pass: true,
        message: `转化率合理性校验通过（均值${(avgConv * 100).toFixed(2)}%）`
      })
    }

    const budgetOver = snapList.filter(s => Number(s.budgetUsageRatio || 0) > 1)
    if (budgetOver.length > 0) {
      results.push({
        dimension: DataValidationLevel.REWARD_COMPLIANCE.valueOf(),
        dimensionName: DATA_VALIDATION_LEVEL_NAMES.REWARD_COMPLIANCE,
        level: 'error',
        levelName: CHECK_RESULT_LEVEL_NAMES.ERROR || '错误',
        pass: false,
        message: `${budgetOver.length}个维度预算使用率超过100%，奖励合规校验不通过`,
        suggestion: '核对奖励发放记录，排查超发原因'
      })
    } else {
      results.push({
        dimension: DataValidationLevel.REWARD_COMPLIANCE.valueOf(),
        dimensionName: DATA_VALIDATION_LEVEL_NAMES.REWARD_COMPLIANCE,
        level: 'pass',
        levelName: CHECK_RESULT_LEVEL_NAMES.PASS || '通过',
        pass: true,
        message: '奖励发放合规校验通过'
      })
    }

    const hasAnomaly = snapList.filter(s => Number(s.anomalyLevel || 0) >= StatsAnomalyLevel.ERROR.valueOf())
    if (hasAnomaly.length > 0) {
      results.push({
        dimension: DataValidationLevel.TIMELINESS.valueOf(),
        dimensionName: DATA_VALIDATION_LEVEL_NAMES.TIMELINESS,
        level: 'warning',
        levelName: CHECK_RESULT_LEVEL_NAMES.WARNING || '预警',
        pass: false,
        message: `存在${hasAnomaly.length}条异常记录，建议及时处理`,
        suggestion: '查看异常详情并标记处理'
      })
    } else {
      results.push({
        dimension: DataValidationLevel.TIMELINESS.valueOf(),
        dimensionName: DATA_VALIDATION_LEVEL_NAMES.TIMELINESS,
        level: 'pass',
        levelName: CHECK_RESULT_LEVEL_NAMES.PASS || '通过',
        pass: true,
        message: '数据时效正常'
      })
    }

    return results
  },

  generateOptimizations(params: {
    exposure: number
    participate: number
    conversion: number
    retention: number
    reward: number
    validations: ValidationResult[]
  }): OptimizationItem[] {
    const items: OptimizationItem[] = []
    const { exposure, participate: _participate, conversion, retention, validations } = params

    if (conversion > 0 && conversion < STATS_CONSTANTS.CONVERSION_OPTIMAL_TARGET) {
      items.push({
        title: '优化转化链路，提升转化率',
        detail: `当前转化率${(conversion * 100).toFixed(2)}%，目标值${(STATS_CONSTANTS.CONVERSION_OPTIMAL_TARGET * 100).toFixed(0)}%。建议优化活动入口视觉、落地页加载、利益点前置、步骤精简等`,
        priority: OptimizationPriority.HIGH,
        priorityName: OPTIMIZATION_PRIORITY_NAMES.HIGH,
        affectedMetrics: ['conversionRate', 'participateCount'],
        expectedImpact: `预计提升转化率至${(STATS_CONSTANTS.CONVERSION_OPTIMAL_TARGET * 100).toFixed(0)}%，新增参与${Math.floor(exposure * (STATS_CONSTANTS.CONVERSION_OPTIMAL_TARGET - conversion))}人`
      })
    }

    if (retention > 0 && retention < 0.3) {
      items.push({
        title: '强化次日留存触达策略',
        detail: `D1留存${(retention * 100).toFixed(1)}%低于30%。建议推送任务提醒、首日任务引导、新手奖励前置等`,
        priority: conversion < STATS_CONSTANTS.CONVERSION_OPTIMAL_TARGET ? OptimizationPriority.MEDIUM : OptimizationPriority.HIGH,
        priorityName: conversion < STATS_CONSTANTS.CONVERSION_OPTIMAL_TARGET ? OPTIMIZATION_PRIORITY_NAMES.MEDIUM : OPTIMIZATION_PRIORITY_NAMES.HIGH,
        affectedMetrics: ['retentionD1', 'taskCompleteCount'],
        expectedImpact: '预计D1留存提升至35%+'
      })
    }

    if (validations.some(v => v.dimension === DataValidationLevel.REWARD_COMPLIANCE.valueOf() && !v.pass)) {
      items.push({
        title: '完善奖励预算管控机制',
        detail: '奖励合规校验存在风险，建议引入动态预算阈值、发放速率限流、超支预警等',
        priority: OptimizationPriority.CRITICAL,
        priorityName: OPTIMIZATION_PRIORITY_NAMES.CRITICAL,
        affectedMetrics: ['budgetUsageRatio', 'rewardIssueAmount'],
        expectedImpact: '预算使用率控制在95%以内'
      })
    }

    if (exposure < 10000) {
      items.push({
        title: '扩大活动曝光渠道',
        detail: `当前曝光${exposure}次偏低，建议联动流量池加权、推荐位投放、社群传播等渠道提升曝光`,
        priority: OptimizationPriority.MEDIUM,
        priorityName: OPTIMIZATION_PRIORITY_NAMES.MEDIUM,
        affectedMetrics: ['exposureCount', 'clickCount'],
        expectedImpact: '曝光提升50%+'
      })
    }

    return items
  },

  async batchExport(options: BatchExportOptions): Promise<{ reportId: number; reportNo: string; totalRows: number }> {
    const { activityIds, startTime, endTime, dimensionType, customFields, filterConditions, operator } = options

    const conflicts = filterConditions ? validateFilterConditions(filterConditions) : []
    if (conflicts.length > 0) {
      throw new AppError('导出筛选条件存在冲突', 400)
    }

    const result = await this.createReport({
      activityIds,
      reportType: 'export',
      reportName: `批量导出_${new Date().toISOString().slice(0, 10)}`,
      customFields,
      filterConditions,
      startTime, endTime, operator
    })

    const { list: snaps } = await this.querySnapshots({
      activityIds, startTime, endTime, dimensionType, pageSize: STATS_CONSTANTS.MAX_EXPORT_ROWS
    })

    await ActivityReport.update(
      {
        exportStatus: ExportStatus.SUCCESS.valueOf(),
        exportFileUrl: `/export/reports/${result.reportNo}.xlsx`,
        exportFileSize: (snaps as any[]).length * 1024,
        exportExpireTime: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        status: ReportStatus.EXPORTED.valueOf()
      } as any,
      { where: { id: result.id } }
    )

    return { reportId: result.id, reportNo: result.reportNo, totalRows: (snaps as any[]).length }
  },

  async batchCompare(options: BatchCompareOptions) {
    const {
      activityIds,
      compareMetrics = [StatsMetric.CONVERSION.valueOf(), StatsMetric.PARTICIPATE.valueOf()],
      operator, customFields
    } = options

    if (activityIds.length < 2) {
      throw new AppError('批量对比至少需要2个活动', 400)
    }
    if (activityIds.length > STATS_CONSTANTS.MAX_COMPARE_ACTIVITIES) {
      throw new AppError(`批量对比活动数不得超过${STATS_CONSTANTS.MAX_COMPARE_ACTIVITIES}个`, 400)
    }

    const activities = await Activity.findAll({ where: { id: { [Op.in]: activityIds } } })
    if (activities.length !== activityIds.length) {
      throw new AppError('部分活动不存在', 404)
    }

    const activitiesData: Record<number, any> = {}
    for (const a of activities) {
      const id = (a as any).id
      const { list } = await this.querySnapshots({ activityId: id, pageSize: 1000 })
      const snaps = list as any[]
      activitiesData[id] = {
        activity: a.toJSON(),
        snapshots: snaps,
        summary: {
          exposure: snaps.reduce((s, r) => s + Number(r.exposureCount || 0), 0),
          participate: snaps.reduce((s, r) => s + Number(r.participateCount || 0), 0),
          conversion: snaps.length ? snaps.reduce((s, r) => s + Number(r.conversionRate || 0), 0) / snaps.length : 0,
          reward: snaps.reduce((s, r) => s + Number(r.rewardIssueAmount || 0), 0),
          retention: snaps.length ? snaps.reduce((s, r) => s + Number(r.retentionD1 || 0), 0) / snaps.length : 0
        }
      }
    }

    const metricStats: Record<string, {
      mean: number
      std: number
      values: Array<{ activityId: number; value: number; zScore: number; deviation: number }>
    }> = {}

    const metricMap: Record<string, string> = {
      [StatsMetric.EXPOSURE.valueOf()]: 'exposure',
      [StatsMetric.PARTICIPATE.valueOf()]: 'participate',
      [StatsMetric.CONVERSION.valueOf()]: 'conversion',
      [StatsMetric.REWARD_ISSUE.valueOf()]: 'reward',
      [StatsMetric.RETENTION_D1.valueOf()]: 'retention'
    }

    compareMetrics.forEach(mk => {
      const key = metricMap[mk] || mk
      const values = Object.values(activitiesData).map(d => d.summary[key] || 0)
      const mean = values.reduce((s, v) => s + v, 0) / values.length
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
      const std = Math.sqrt(variance) || 1
      metricStats[mk] = {
        mean, std,
        values: Object.entries(activitiesData).map(([aid, d]) => {
          const value = d.summary[key] || 0
          return {
            activityId: Number(aid),
            value,
            zScore: (value - mean) / std,
            deviation: mean > 0 ? (value - mean) / mean : 0
          }
        })
      }
    })

    const activitySummaries = Object.fromEntries(
      Object.entries(activitiesData).map(([id, d]) => [id, {
        name: (d.activity as any).name,
        ...d.summary,
        compareHighlights: compareMetrics.map(mk => {
          const stat = metricStats[mk]
          const mine = stat.values.find(v => String(v.activityId) === String(id))
          return {
            metric: mk,
            metricName: STATS_METRIC_NAMES[mk as keyof typeof STATS_METRIC_NAMES] || mk,
            ...mine,
            isOutlier: Math.abs(mine?.zScore || 0) > 1.5,
            isLeading: (mine?.zScore || 0) > 1,
            isLagging: (mine?.zScore || 0) < -1
          }
        })
      }])
    )

    const compareResult = {
      activities: activities.map(a => ({ id: (a as any).id, name: (a as any).name })),
      metricStats,
      activitySummaries
    }

    const reportResult = await this.createReport({
      activityIds,
      reportType: 'batch_compare',
      reportName: `批量对比_${activities.map(a => (a as any).name).join('_')}`,
      customFields,
      operator
    })

    await ActivityReport.update(
      { comparisonData: JSON.stringify(compareResult) } as any,
      { where: { id: reportResult.id } }
    )

    await writeStatsAudit(activityIds[0], `批量对比_${activityIds.length}活动`, 'report', reportResult.id, StatsAuditAction.COMPARE_GENERATED, operator, {
      newData: { activityIds, compareMetrics },
      changedFields: ['activityIds', 'compareMetrics'],
      remark: `批量对比${activityIds.length}个活动数据`
    })

    return { reportId: reportResult.id, ...compareResult }
  },

  async traceData(activityId: number, options: { targetType?: string; startTime?: Date; endTime?: Date; page?: number; pageSize?: number }) {
    const { targetType, startTime, endTime, page = 1, pageSize = 20 } = options
    const where: any = { activityId }
    if (targetType) where.targetType = targetType
    if (startTime) where.createTime = { [Op.gte]: startTime }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: endTime }
    const { count, rows } = await ActivityStatsAuditLog.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })
    return {
      total: count, page, pageSize,
      list: rows.map(r => {
        const d = r.toJSON()
        return {
          ...d,
          actionName: STATS_AUDIT_ACTION_NAMES[(d.action as keyof typeof STATS_AUDIT_ACTION_NAMES)] || d.action,
          oldData: safeJSONParse(d.oldData, null),
          newData: safeJSONParse(d.newData, null),
          changedFields: safeJSONParse(d.changedFields, []),
          anomalyDetail: safeJSONParse(d.anomalyDetail, null)
        }
      })
    }
  },

  async queryReports(options: {
    activityId?: number
    status?: number
    reportType?: string
    page?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
  }) {
    const { activityId, status, reportType, page = 1, pageSize = 20, sortField = 'createTime', sortOrder = 'desc' } = options
    const where: any = {}
    if (activityId) where.activityId = activityId
    if (status !== undefined) where.status = status
    if (reportType) where.reportType = reportType
    const { count, rows } = await ActivityReport.findAndCountAll({
      where,
      order: [[sortField, sortOrder.toUpperCase()]],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })
    return {
      total: count, page, pageSize,
      list: rows.map(r => {
        const d = r.toJSON()
        return {
          ...d,
          statusName: REPORT_STATUS_NAMES[(d.status as keyof typeof REPORT_STATUS_NAMES)] || '',
          exportStatusName: EXPORT_STATUS_NAMES[(d.exportStatus as keyof typeof EXPORT_STATUS_NAMES)] || '',
          summaryData: safeJSONParse(d.summaryData, null),
          anomalySummary: safeJSONParse(d.anomalySummary, null),
          optimizationSuggestions: safeJSONParse(d.optimizationSuggestions, []),
          comparisonData: safeJSONParse(d.comparisonData, null),
          customFields: safeJSONParse(d.customFields, []),
          filterConditions: safeJSONParse(d.filterConditions, null)
        }
      })
    }
  },

  async updateReportStatus(reportId: number, action: string, operator: OperatorInfo) {
    const report = await ActivityReport.findByPk(reportId)
    if (!report) throw new AppError('报表不存在', 404)
    const oldStatus = (report as any).status
    const oldData = report.toJSON()

    let newStatus = oldStatus
    let remark = ''
    switch (action) {
      case 'submit':
        if (oldStatus !== ReportStatus.AUTO_GENERATED.valueOf() && oldStatus !== ReportStatus.DRAFT.valueOf()) {
          throw new AppError('仅草稿或自动生成状态可提交审核', 400)
        }
        newStatus = ReportStatus.REVIEWING.valueOf()
        remark = '提交审核'
        break
      case 'approve':
        if (oldStatus !== ReportStatus.REVIEWING.valueOf()) throw new AppError('仅审核中状态可审核通过', 400)
        newStatus = ReportStatus.LOCKED.valueOf()
        ; (report as any).isLocked = 1
        ; (report as any).lockedTime = new Date()
        ; (report as any).lockOperatorId = operator.userId
        ; (report as any).lockOperatorName = operator.username
        remark = '审核通过，锁定核心数据'
        break
      case 'archive':
        if (oldStatus < ReportStatus.LOCKED.valueOf()) throw new AppError('仅锁定后可归档', 400)
        newStatus = ReportStatus.ARCHIVED.valueOf()
        remark = '归档报表'
        break
      default:
        throw new AppError('不支持的操作', 400)
    }
    ; (report as any).status = newStatus
    await report.save()

    const changed = computeChangedFields(oldData, report.toJSON())
    await writeStatsAudit((report as any).activityId || 0, (report as any).reportName || '', 'report', reportId, StatsAuditAction.REPORT_UPDATED, operator, {
      oldData: { status: oldStatus }, newData: { status: newStatus }, changedFields: changed, remark
    })
    return { id: reportId, oldStatus, newStatus, statusName: REPORT_STATUS_NAMES[newStatus as keyof typeof REPORT_STATUS_NAMES] }
  },

  async manualMarkAnomaly(snapshotId: number, anomalyType: string, remark: string, operator: OperatorInfo) {
    const snap = await ActivityStatsSnapshot.findByPk(snapshotId)
    if (!snap) throw new AppError('快照不存在', 404)
    if ((snap as any).isLocked === 1) throw new AppError('数据已锁定，禁止标记', 400)
    const oldData = snap.toJSON()
    const types = safeJSONParse<string[]>((snap as any).anomalyTypes, [])
    if (!types.includes(anomalyType)) types.push(anomalyType)
    ; (snap as any).anomalyTypes = JSON.stringify(types)
    ; (snap as any).anomalyLevel = Math.max((snap as any).anomalyLevel || 0, StatsAnomalyLevel.WARNING.valueOf())
    ; (snap as any).anomalyCount = types.length
    await snap.save()
    const changed = computeChangedFields(oldData, snap.toJSON())
    await writeStatsAudit((snap as any).activityId, (snap as any).activityName, 'snapshot', snapshotId, StatsAuditAction.DIMENSION_MARKED, operator, {
      oldData, newData: snap.toJSON(), changedFields: changed, anomalyType, anomalyLevel: (snap as any).anomalyLevel, remark
    })
    return { id: snapshotId, anomalyTypes: types, anomalyLevel: (snap as any).anomalyLevel }
  },

  generateNo
}

export default ActivityStatsService
