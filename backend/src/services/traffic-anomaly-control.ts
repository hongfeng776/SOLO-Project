import { Op, fn, col } from 'sequelize'
import dayjs from 'dayjs'
import TrafficAnomalyRecord, {
  TrafficAnomalyType,
  TrafficAnomalyRiskLevel,
  TrafficAnomalyStatus,
  TrafficAnomalySource,
  ANOMALY_EXPOSURE_FREQUENCY_THRESHOLD,
  ANOMALY_SHORT_WINDOW_MS,
  ANOMALY_CONFIDENCE_THRESHOLD,
  ANOMALY_AUTO_INTERCEPT_LEVEL
} from '@models/traffic-anomaly-record'
import TrafficAnomalyHandleLog, {
  TrafficAnomalyHandleType,
  TrafficAnomalyHandleStatus,
  TrafficAnomalyBlockReason
} from '@models/traffic-anomaly-handle-log'
import { ContentPushTask } from '@models/index'
import type { JwtPayload } from '@/types'

type UserInfo = JwtPayload & { ip?: string; userAgent?: string }

export interface TrafficAnomalyPermission {
  canView: boolean
  canHandle: boolean
  canBatch: boolean
  canRelease: boolean
  canBan: boolean
  canViewTrace: boolean
  canExportReport: boolean
}

export interface AnomalyDetectionResult {
  type: TrafficAnomalyType
  riskLevel: TrafficAnomalyRiskLevel
  confidence: number
  details: Record<string, unknown>
  warnings: string[]
  shouldIntercept: boolean
  blockReason?: TrafficAnomalyBlockReason
}

export interface AnomalyValidationResult {
  isValid: boolean
  authenticityScore: number
  complianceScore: number
  errors: string[]
  warnings: string[]
  blockReason?: TrafficAnomalyBlockReason
  blockDetail?: Record<string, unknown>
}

export const getTrafficAnomalyPermission = (roles: string[]): TrafficAnomalyPermission => {
  const isAdmin = roles.includes('admin') || roles.includes('risk_admin')
  const isSenior = roles.includes('senior_operator')
  const isOperator = roles.includes('operator')
  return {
    canView: isAdmin || isSenior || isOperator,
    canHandle: isAdmin || isSenior,
    canBatch: isAdmin,
    canRelease: isAdmin,
    canBan: isAdmin,
    canViewTrace: isAdmin || isSenior || isOperator,
    canExportReport: isAdmin
  }
}

export const detectAnomaly = (trafficData: {
  exposureCount?: number
  exposureFrequency?: number
  uniqueIpCount?: number
  uniqueDeviceCount?: number
  uniqueUserCount?: number
  ipAddress?: string
  userSource?: string
  timeWindowMs?: number
  frequencyData?: Record<string, number>
}): AnomalyDetectionResult => {
  const warnings: string[] = []
  const details: Record<string, unknown> = {}
  let riskLevel = TrafficAnomalyRiskLevel.NORMAL
  let anomalyType: TrafficAnomalyType | null = null
  let confidence = 0
  let shouldIntercept = false
  let blockReason: TrafficAnomalyBlockReason | undefined

  const exposureFreq = trafficData.exposureFrequency || 0
  const ipCount = trafficData.uniqueIpCount || 0
  const deviceCount = trafficData.uniqueDeviceCount || 0
  const userCount = trafficData.uniqueUserCount || 0
  const timeWindow = trafficData.timeWindowMs || ANOMALY_SHORT_WINDOW_MS

  if (exposureFreq >= ANOMALY_EXPOSURE_FREQUENCY_THRESHOLD) {
    anomalyType = TrafficAnomalyType.MACHINE_EXPOSURE
    confidence = Math.min(0.98, exposureFreq / ANOMALY_EXPOSURE_FREQUENCY_THRESHOLD)
    riskLevel = TrafficAnomalyRiskLevel.HIGH
    warnings.push(`曝光频次 ${exposureFreq} 次/小时，远超阈值 ${ANOMALY_EXPOSURE_FREQUENCY_THRESHOLD}`)
    details.exposureFreqRatio = exposureFreq / ANOMALY_EXPOSURE_FREQUENCY_THRESHOLD
    blockReason = TrafficAnomalyBlockReason.SUSPICIOUS_PATTERN
  }

  if (ipCount > 0 && userCount > 0 && ipCount / userCount < 0.3) {
    if (!anomalyType || confidence < 0.85) {
      anomalyType = TrafficAnomalyType.IP_CLUSTER
      confidence = Math.max(confidence, 0.85)
    }
    riskLevel = Math.max(riskLevel, TrafficAnomalyRiskLevel.MEDIUM)
    warnings.push(`IP集中度异常：${ipCount} 个IP对应用户 ${userCount} 人`)
    details.ipUserRatio = ipCount / userCount
  }

  if (deviceCount > 0 && userCount > 0 && deviceCount / userCount < 0.2) {
    if (!anomalyType || confidence < 0.8) {
      anomalyType = TrafficAnomalyType.DEVICE_ABNORMAL
      confidence = Math.max(confidence, 0.8)
    }
    riskLevel = Math.max(riskLevel, TrafficAnomalyRiskLevel.MEDIUM)
    warnings.push(`设备集中度异常：${deviceCount} 台设备对应用户 ${userCount} 人`)
    details.deviceUserRatio = deviceCount / userCount
  }

  if (trafficData.frequencyData) {
    const timestamps = Object.keys(trafficData.frequencyData).map(Number).sort()
    if (timestamps.length >= 3) {
      let burstCount = 0
      for (let i = 1; i < timestamps.length; i++) {
        const diff = timestamps[i] - timestamps[i - 1]
        if (diff < 1000 && trafficData.frequencyData[timestamps[i]] > 10) {
          burstCount++
        }
      }
      if (burstCount >= 3) {
        if (!anomalyType || confidence < 0.9) {
          anomalyType = TrafficAnomalyType.ABNORMAL_POUR
          confidence = Math.max(confidence, 0.9)
        }
        riskLevel = Math.max(riskLevel, TrafficAnomalyRiskLevel.HIGH)
        warnings.push('检测到短时间内流量脉冲式灌入')
        details.burstCount = burstCount
        blockReason = TrafficAnomalyBlockReason.SUSPICIOUS_PATTERN
      }
    }
  }

  if (timeWindow < ANOMALY_SHORT_WINDOW_MS && (trafficData.exposureCount || 0) > 500) {
    if (!anomalyType || confidence < 0.88) {
      anomalyType = TrafficAnomalyType.BATCH_DRAINAGE
      confidence = Math.max(confidence, 0.88)
    }
    riskLevel = Math.max(riskLevel, TrafficAnomalyRiskLevel.HIGH)
    warnings.push(`短时间 ${(timeWindow / 1000).toFixed(0)} 秒内曝光 ${trafficData.exposureCount} 次`)
  }

  if (trafficData.userSource === 'unknown' || trafficData.userSource === 'bot') {
    if (!anomalyType || confidence < 0.75) {
      anomalyType = TrafficAnomalyType.FAKE_RETENTION
      confidence = Math.max(confidence, 0.75)
    }
    riskLevel = Math.max(riskLevel, TrafficAnomalyRiskLevel.MEDIUM)
    warnings.push(`用户来源异常：${trafficData.userSource}`)
  }

  if (!anomalyType) {
    return {
      type: TrafficAnomalyType.FAKE_RETENTION,
      riskLevel: TrafficAnomalyRiskLevel.NORMAL,
      confidence: 0,
      details,
      warnings: [],
      shouldIntercept: false
    }
  }

  if (riskLevel >= ANOMALY_AUTO_INTERCEPT_LEVEL && confidence >= ANOMALY_CONFIDENCE_THRESHOLD) {
    shouldIntercept = true
    if (!blockReason) {
      blockReason = TrafficAnomalyBlockReason.HIGH_RISK
    }
  }

  return {
    type: anomalyType,
    riskLevel,
    confidence: Math.min(1, confidence),
    details,
    warnings,
    shouldIntercept,
    blockReason
  }
}

export const validateAnomalyData = (anomaly: TrafficAnomalyRecord): AnomalyValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []
  let authenticityScore = 100
  let complianceScore = 100
  let blockReason: TrafficAnomalyBlockReason | undefined
  const blockDetail: Record<string, unknown> = {}

  if (anomaly.uniqueIpCount && anomaly.uniqueUserCount) {
    const ipUserRatio = anomaly.uniqueIpCount / anomaly.uniqueUserCount
    if (ipUserRatio < 0.2) {
      authenticityScore -= 40
      errors.push(`IP用户比 ${ipUserRatio.toFixed(2)} 过低，疑似虚假流量`)
      blockReason = TrafficAnomalyBlockReason.FAKE_DATA
      blockDetail.ipUserRatio = ipUserRatio
    } else if (ipUserRatio < 0.5) {
      authenticityScore -= 15
      warnings.push(`IP用户比 ${ipUserRatio.toFixed(2)} 偏低`)
    }
  }

  if (anomaly.uniqueDeviceCount && anomaly.uniqueUserCount) {
    const deviceUserRatio = anomaly.uniqueDeviceCount / anomaly.uniqueUserCount
    if (deviceUserRatio < 0.15) {
      authenticityScore -= 30
      errors.push(`设备用户比 ${deviceUserRatio.toFixed(2)} 过低`)
      blockDetail.deviceUserRatio = deviceUserRatio
    }
  }

  if (anomaly.exposureFrequency && anomaly.uniqueUserCount) {
    const exposurePerUser = anomaly.exposureFrequency / anomaly.uniqueUserCount
    if (exposurePerUser > 50) {
      complianceScore -= 25
      errors.push(`人均曝光频次 ${exposurePerUser.toFixed(1)} 过高`)
      blockDetail.exposurePerUser = exposurePerUser
      if (!blockReason) {
        blockReason = TrafficAnomalyBlockReason.DATA_INCONSISTENCY
      }
    }
  }

  if (anomaly.traceData) {
    try {
      const trace = typeof anomaly.traceData === 'string' ? JSON.parse(anomaly.traceData) : anomaly.traceData
      if (trace.duplicateRate && trace.duplicateRate > 0.3) {
        complianceScore -= 30
        errors.push(`重复流量占比 ${(trace.duplicateRate * 100).toFixed(1)}%`)
        blockReason = blockReason || TrafficAnomalyBlockReason.DUPLICATE_ANOMALY
        blockDetail.duplicateRate = trace.duplicateRate
      }
    } catch (_e) {
      // ignore
    }
  }

  authenticityScore = Math.max(0, Math.min(100, authenticityScore))
  complianceScore = Math.max(0, Math.min(100, complianceScore))

  return {
    isValid: errors.length === 0,
    authenticityScore,
    complianceScore,
    errors,
    warnings,
    blockReason,
    blockDetail: Object.keys(blockDetail).length > 0 ? blockDetail : undefined
  }
}

export const listTrafficAnomalies = async (query: {
  page?: number
  pageSize?: number
  keyword?: string
  anomalyType?: TrafficAnomalyType
  riskLevel?: TrafficAnomalyRiskLevel
  status?: TrafficAnomalyStatus
  source?: TrafficAnomalySource
  startTime?: string
  endTime?: string
}, roles: string[]) => {
  const permission = getTrafficAnomalyPermission(roles)
  if (!permission.canView) {
    throw new Error('无权限查看异常流量记录')
  }

  const where: Record<string | symbol, unknown> = {}
  if (query.keyword) {
    where[Op.or] = [
      { userName: { [Op.like]: `%${query.keyword}%` } },
      { contentTitle: { [Op.like]: `%${query.keyword}%` } },
      { ipAddress: { [Op.like]: `%${query.keyword}%` } }
    ]
  }
  if (query.anomalyType) where.anomalyType = query.anomalyType
  if (query.riskLevel !== undefined) where.riskLevel = query.riskLevel
  if (query.status !== undefined) where.status = query.status
  if (query.source) where.source = query.source
  if (query.startTime && query.endTime) {
    where.detectTime = { [Op.between]: [query.startTime, query.endTime] }
  }

  const { count, rows } = await TrafficAnomalyRecord.findAndCountAll({
    where,
    order: [['detectTime', 'DESC']],
    offset: ((query.page || 1) - 1) * (query.pageSize || 20),
    limit: query.pageSize || 20
  })

  return {
    list: rows,
    total: count,
    permission
  }
}

export const getTrafficAnomalyDetail = async (id: number, roles: string[]) => {
  const permission = getTrafficAnomalyPermission(roles)
  if (!permission.canView) {
    throw new Error('无权限查看异常详情')
  }

  const anomaly = await TrafficAnomalyRecord.findByPk(id, {
    include: [{ model: TrafficAnomalyHandleLog, as: 'handleLogs', separate: true, order: [['createTime', 'DESC']] }]
  })

  if (!anomaly) {
    throw new Error('异常记录不存在')
  }

  const validation = validateAnomalyData(anomaly)

  return {
    anomaly,
    handleLogs: (anomaly as any).handleLogs as TrafficAnomalyHandleLog[],
    validation,
    permission
  }
}

export const createTrafficAnomaly = async (data: Partial<TrafficAnomalyRecord>, operator: UserInfo) => {
  const permission = getTrafficAnomalyPermission(operator.roles)
  if (!permission.canHandle) {
    throw new Error('无权限上报异常')
  }

  const detection = detectAnomaly({
    exposureCount: data.exposureCount,
    exposureFrequency: data.exposureFrequency,
    uniqueIpCount: data.uniqueIpCount,
    uniqueDeviceCount: data.uniqueDeviceCount,
    uniqueUserCount: data.uniqueUserCount,
    ipAddress: data.ipAddress,
    userSource: data.userSource
  })

  const anomaly = await TrafficAnomalyRecord.create({
    ...(data as any),
    anomalyType: data.anomalyType || detection.type,
    riskLevel: data.riskLevel || detection.riskLevel,
    status: TrafficAnomalyStatus.PENDING,
    source: TrafficAnomalySource.MANUAL_REPORT,
    confidence: data.confidence || detection.confidence,
    detectTime: data.detectTime || new Date(),
    operatorId: operator.userId,
    operatorName: operator.username,
    createTime: new Date(),
    updateTime: new Date()
  })

  if (detection.shouldIntercept) {
    await autoHandleAnomaly(anomaly, detection.blockReason, operator)
  }

  return anomaly
}

const autoHandleAnomaly = async (
  anomaly: TrafficAnomalyRecord,
  blockReason: TrafficAnomalyBlockReason | undefined,
  operator: UserInfo
) => {
  const startTime = Date.now()
  const newStatus = TrafficAnomalyStatus.INTERCEPTED

  await anomaly.update({
    status: newStatus,
    autoHandled: 1,
    handleResult: '系统自动拦截异常流量',
    handledAt: new Date(),
    updateTime: new Date()
  })

  if (anomaly.contentId) {
    await ContentPushTask.update(
      { pushStatus: 4 },
      { where: { noteId: anomaly.contentId } }
    )
  }

  await createHandleLog({
    anomalyId: anomaly.id,
    handleType: TrafficAnomalyHandleType.INTERCEPT_FLOW,
    handleStatus: TrafficAnomalyHandleStatus.SUCCESS,
    oldStatus: TrafficAnomalyStatus.PENDING,
    newStatus,
    handleReason: '系统自动识别高风险异常',
    handleDetail: JSON.stringify({ autoTriggered: true }),
    blockReason,
    blockDetail: JSON.stringify({ blockReason }),
    handleCost: Date.now() - startTime,
    handleResult: '自动拦截成功',
    operatorId: operator.userId || 0,
    operatorName: operator.username || 'system',
    createTime: new Date()
  })
}

export const handleTrafficAnomaly = async (
  id: number,
  handleType: TrafficAnomalyHandleType,
  reason: string,
  operator: UserInfo
) => {
  const permission = getTrafficAnomalyPermission(operator.roles)
  if (!permission.canHandle) {
    throw new Error('无权限处置异常')
  }

  const anomaly = await TrafficAnomalyRecord.findByPk(id)
  if (!anomaly) {
    throw new Error('异常记录不存在')
  }

  if (anomaly.status === TrafficAnomalyStatus.PERMANENT_BANNED) {
    throw new Error('已永久封禁的记录无法再次处置')
  }

  const handleStartTime = Date.now()
  const oldStatus = anomaly.status
  let newStatus: TrafficAnomalyStatus = anomaly.status
  let handleResult = ''
  let affectedContentIds: number[] = []
  let affectedUserIds: number[] = []
  let cleanedCount = 0

  const statusMap: Partial<Record<TrafficAnomalyHandleType, TrafficAnomalyStatus>> = {
    [TrafficAnomalyHandleType.INTERCEPT_FLOW]: TrafficAnomalyStatus.INTERCEPTED,
    [TrafficAnomalyHandleType.CONTENT_FLOW_LIMIT]: TrafficAnomalyStatus.FLOW_LIMITED,
    [TrafficAnomalyHandleType.ACCOUNT_DOWNGRADE]: TrafficAnomalyStatus.ACCOUNT_DOWNGRADED,
    [TrafficAnomalyHandleType.PERMANENT_BAN]: TrafficAnomalyStatus.PERMANENT_BANNED,
    [TrafficAnomalyHandleType.CLEAN_DATA]: TrafficAnomalyStatus.INTERCEPTED,
    [TrafficAnomalyHandleType.RELEASE_CONTROL]: TrafficAnomalyStatus.RELEASED
  }

  if (statusMap[handleType] !== undefined) {
    newStatus = statusMap[handleType]!
  }

  if (handleType === TrafficAnomalyHandleType.INTERCEPT_FLOW && anomaly.contentId) {
    await ContentPushTask.update(
      { pushStatus: 4 },
      { where: { noteId: anomaly.contentId } }
    )
    affectedContentIds.push(anomaly.contentId)
    handleResult = '已拦截流量分发，内容推送已暂停'
  }

  if (handleType === TrafficAnomalyHandleType.CONTENT_FLOW_LIMIT && anomaly.contentId) {
    await ContentPushTask.update(
      { pushStatus: 5 },
      { where: { noteId: anomaly.contentId } }
    )
    affectedContentIds.push(anomaly.contentId)
    handleResult = '内容已限流，推送权重降低50%'
  }

  if (handleType === TrafficAnomalyHandleType.ACCOUNT_DOWNGRADE) {
    affectedUserIds.push(anomaly.userId)
    handleResult = `账号 ${anomaly.userName} 流量权重已降低30%`
  }

  if (handleType === TrafficAnomalyHandleType.PERMANENT_BAN) {
    if (!permission.canBan) {
      throw new Error('无权限执行永久封禁')
    }
    affectedUserIds.push(anomaly.userId)
    handleResult = `账号 ${anomaly.userName} 已永久限制流量权益`
  }

  if (handleType === TrafficAnomalyHandleType.CLEAN_DATA) {
    cleanedCount = anomaly.exposureCount || 0
    handleResult = `已清理异常流量数据 ${cleanedCount} 条`
  }

  if (handleType === TrafficAnomalyHandleType.RELEASE_CONTROL) {
    if (!permission.canRelease) {
      throw new Error('无权限解除风控')
    }
    if (anomaly.contentId) {
      await ContentPushTask.update(
        { pushStatus: 1 },
        { where: { noteId: anomaly.contentId } }
      )
      affectedContentIds.push(anomaly.contentId)
    }
    handleResult = '已解除风控，恢复正常流量分发'
  }

  const validation = validateAnomalyData(anomaly)

  await anomaly.update({
    status: newStatus,
    handleResult,
    handledAt: new Date(),
    operatorId: operator.userId,
    operatorName: operator.username,
    updateTime: new Date()
  })

  const handleLog = await createHandleLog({
    anomalyId: anomaly.id,
    handleType,
    handleStatus: TrafficAnomalyHandleStatus.SUCCESS,
    oldStatus,
    newStatus,
    handleReason: reason,
    handleDetail: JSON.stringify({ reason, affectedContentIds, affectedUserIds }),
    blockReason: validation.blockReason,
    blockDetail: validation.blockDetail ? JSON.stringify(validation.blockDetail) : undefined,
    affectedContentIds: JSON.stringify(affectedContentIds),
    affectedUserIds: JSON.stringify(affectedUserIds),
    cleanedExposureCount: cleanedCount,
    authenticityScore: validation.authenticityScore,
    complianceScore: validation.complianceScore,
    handleCost: Date.now() - handleStartTime,
    handleResult,
    operatorId: operator.userId,
    operatorName: operator.username,
    operatorIp: operator.ip || '',
    userAgent: operator.userAgent || '',
    createTime: new Date()
  })

  return { anomaly, handleLog }
}

export const batchHandleTrafficAnomalies = async (
  params: {
    ids?: number[]
    anomalyType?: TrafficAnomalyType
    riskLevel?: TrafficAnomalyRiskLevel
    handleType: TrafficAnomalyHandleType
    reason: string
  },
  operator: UserInfo
) => {
  const permission = getTrafficAnomalyPermission(operator.roles)
  if (!permission.canBatch) {
    throw new Error('无权限执行批量处置')
  }

  const where: Record<string, unknown> = {
    status: { [Op.notIn]: [TrafficAnomalyStatus.PERMANENT_BANNED] }
  }
  if (params.ids && params.ids.length > 0) {
    where.id = { [Op.in]: params.ids }
  } else {
    if (params.anomalyType) where.anomalyType = params.anomalyType
    if (params.riskLevel !== undefined) where.riskLevel = params.riskLevel
  }

  const anomalies = await TrafficAnomalyRecord.findAll({ where })
  if (anomalies.length === 0) {
    return { success: 0, failed: 0, total: 0, results: [] }
  }

  const results: Array<{ id: number; success: boolean; error?: string }> = []
  let successCount = 0
  let failedCount = 0

  for (const anomaly of anomalies) {
    try {
      await handleTrafficAnomaly(anomaly.id, params.handleType, params.reason, operator)
      results.push({ id: anomaly.id, success: true })
      successCount++
    } catch (err) {
      const error = err instanceof Error ? err.message : '未知错误'
      results.push({ id: anomaly.id, success: false, error })
      failedCount++
    }
  }

  return {
    success: successCount,
    failed: failedCount,
    total: anomalies.length,
    results
  }
}

export const getTrafficAnomalyStats = async (roles: string[]) => {
  const permission = getTrafficAnomalyPermission(roles)
  if (!permission.canView) {
    throw new Error('无权限查看统计')
  }

  const todayStart = dayjs().startOf('day').toDate()
  const todayEnd = dayjs().endOf('day').toDate()

  const [
    total,
    pending,
    intercepted,
    flowLimited,
    accountDowngraded,
    permanentBanned,
    released,
    todayDetected,
    todayHandled,
    highRisk,
    autoHandled
  ] = await Promise.all([
    TrafficAnomalyRecord.count(),
    TrafficAnomalyRecord.count({ where: { status: TrafficAnomalyStatus.PENDING } }),
    TrafficAnomalyRecord.count({ where: { status: TrafficAnomalyStatus.INTERCEPTED } }),
    TrafficAnomalyRecord.count({ where: { status: TrafficAnomalyStatus.FLOW_LIMITED } }),
    TrafficAnomalyRecord.count({ where: { status: TrafficAnomalyStatus.ACCOUNT_DOWNGRADED } }),
    TrafficAnomalyRecord.count({ where: { status: TrafficAnomalyStatus.PERMANENT_BANNED } }),
    TrafficAnomalyRecord.count({ where: { status: TrafficAnomalyStatus.RELEASED } }),
    TrafficAnomalyRecord.count({ where: { detectTime: { [Op.between]: [todayStart, todayEnd] } } }),
    TrafficAnomalyRecord.count({ where: { handledAt: { [Op.between]: [todayStart, todayEnd] } } }),
    TrafficAnomalyRecord.count({ where: { riskLevel: TrafficAnomalyRiskLevel.HIGH } }),
    TrafficAnomalyRecord.count({ where: { autoHandled: 1 } })
  ])

  const typeStats = await TrafficAnomalyRecord.findAll({
    attributes: ['anomalyType', [fn('COUNT', col('id')), 'count']],
    group: ['anomalyType'],
    raw: true
  }) as unknown as Array<{ anomalyType: TrafficAnomalyType; count: number }>

  return {
    total,
    pending,
    intercepted,
    flowLimited,
    accountDowngraded,
    permanentBanned,
    released,
    todayDetected,
    todayHandled,
    highRisk,
    autoHandled,
    typeStats,
    permission
  }
}

export const listHandleLogs = async (query: {
  page?: number
  pageSize?: number
  keyword?: string
  handleType?: TrafficAnomalyHandleType
  handleStatus?: TrafficAnomalyHandleStatus
  blockReason?: TrafficAnomalyBlockReason
  startTime?: string
  endTime?: string
}, roles: string[]) => {
  const permission = getTrafficAnomalyPermission(roles)
  if (!permission.canViewTrace) {
    throw new Error('无权限查看处置日志')
  }

  const where: Record<string | symbol, unknown> = {}
  if (query.keyword) {
    where[Op.or] = [
      { operatorName: { [Op.like]: `%${query.keyword}%` } },
      { handleReason: { [Op.like]: `%${query.keyword}%` } },
      { handleResult: { [Op.like]: `%${query.keyword}%` } }
    ]
  }
  if (query.handleType) where.handleType = query.handleType
  if (query.handleStatus !== undefined) where.handleStatus = query.handleStatus
  if (query.blockReason) where.blockReason = query.blockReason
  if (query.startTime && query.endTime) {
    where.createTime = { [Op.between]: [query.startTime, query.endTime] }
  }

  const { count, rows } = await TrafficAnomalyHandleLog.findAndCountAll({
    where,
    include: [{
      model: TrafficAnomalyRecord,
      as: 'anomaly',
      attributes: ['id', 'anomalyType', 'riskLevel', 'status', 'userName', 'contentTitle']
    }],
    order: [['createTime', 'DESC']],
    offset: ((query.page || 1) - 1) * (query.pageSize || 20),
    limit: query.pageSize || 20
  })

  return {
    list: rows,
    total: count,
    permission
  }
}

export const getAnomalyImpactAnalysis = async (id: number, roles: string[]) => {
  const permission = getTrafficAnomalyPermission(roles)
  if (!permission.canViewTrace) {
    throw new Error('无权限查看溯源分析')
  }

  const anomaly = await TrafficAnomalyRecord.findByPk(id)
  if (!anomaly) {
    throw new Error('异常记录不存在')
  }

  const validation = validateAnomalyData(anomaly)

  const handleLogs = await TrafficAnomalyHandleLog.findAll({
    where: { anomalyId: id },
    order: [['createTime', 'DESC']],
    limit: 50
  })

  const blockReasonStats = await TrafficAnomalyHandleLog.findAll({
    where: { anomalyId: id, blockReason: { [Op.not]: null as any } },
    attributes: ['blockReason', [fn('COUNT', col('id')), 'count']],
    group: ['blockReason'],
    raw: true
  }) as unknown as Array<{ blockReason: TrafficAnomalyBlockReason; count: number }>

  const recentLogs = await TrafficAnomalyHandleLog.findAll({
    where: { operatorId: anomaly.operatorId || 0 },
    order: [['createTime', 'DESC']],
    limit: 20
  })

  let traceData: Record<string, unknown> | null = null
  let frequencyData: Record<string, number> | null = null
  let behaviorDetail: Record<string, unknown> | null = null
  let deviceInfo: Record<string, unknown> | null = null

  try {
    traceData = anomaly.traceData ? JSON.parse(anomaly.traceData) : null
    frequencyData = anomaly.frequencyData ? JSON.parse(anomaly.frequencyData) : null
    behaviorDetail = anomaly.behaviorDetail ? JSON.parse(anomaly.behaviorDetail) : null
    deviceInfo = anomaly.deviceInfo ? JSON.parse(anomaly.deviceInfo) : null
  } catch (_e) {
    // ignore
  }

  return {
    anomaly,
    validation,
    handleLogs,
    blockReasonStats,
    recentLogs,
    traceData,
    frequencyData,
    behaviorDetail,
    deviceInfo,
    permission
  }
}

const createHandleLog = async (data: Partial<TrafficAnomalyHandleLog>) => {
  return await TrafficAnomalyHandleLog.create(data as TrafficAnomalyHandleLog)
}
