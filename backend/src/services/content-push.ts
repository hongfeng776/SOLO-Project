import { Op, fn, col, literal } from 'sequelize'
import {
  Note,
  TrafficPool,
  ContentPushTask,
  ContentPushTrace
} from '@models/index'
import {
  ContentPushStatus,
  ContentPushStrength,
  PushBlockReason
} from '@models/content-push-task'
import { PushTraceEventType, PushTraceAnomalyType } from '@models/content-push-trace'
import dayjs from 'dayjs'

const MIN_MATCH_SCORE = 60

const ROLE_PERMISSIONS: Record<string, Partial<{
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canPause: boolean
  canTerminate: boolean
  canBatch: boolean
  canViewTrace: boolean
  canAdjustStrength: boolean
}>> = {
  admin: {
    canView: true, canCreate: true, canEdit: true, canPause: true,
    canTerminate: true, canBatch: true, canViewTrace: true, canAdjustStrength: true
  },
  operation_admin: {
    canView: true, canCreate: true, canEdit: true, canPause: true,
    canTerminate: true, canBatch: true, canViewTrace: true, canAdjustStrength: true
  },
  senior_operator: {
    canView: true, canCreate: true, canEdit: true, canPause: true,
    canTerminate: false, canBatch: true, canViewTrace: true, canAdjustStrength: true
  },
  operator: {
    canView: true, canCreate: true, canEdit: false, canPause: true,
    canTerminate: false, canBatch: false, canViewTrace: false, canAdjustStrength: false
  },
  auditor: {
    canView: true, canCreate: false, canEdit: false, canPause: false,
    canTerminate: false, canBatch: false, canViewTrace: true, canAdjustStrength: false
  }
}

export function getPushPermission(roles: string[]) {
  const perms: Record<string, boolean> = {
    canView: false, canCreate: false, canEdit: false, canPause: false,
    canTerminate: false, canBatch: false, canViewTrace: false, canAdjustStrength: false
  }
  roles.forEach(role => {
    const rp = ROLE_PERMISSIONS[role] || {}
    Object.keys(rp).forEach(k => {
      if ((rp as any)[k]) perms[k] = true
    })
  })
  return perms
}

function generateTaskNo() {
  return 'CP' + dayjs().format('YYYYMMDDHHmmss') + Math.random().toString(36).slice(2, 8).toUpperCase()
}

function generateTraceId() {
  return 'TR' + dayjs().format('YYYYMMDDHHmmss') + Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function validateNoteForPush(note: any) {
  const warnings: string[] = []
  const errors: string[] = []
  let blockReason: string = ''
  let blockDetail: string = ''

  if (note.status !== 2) {
    errors.push('笔记未审核通过（状态=' + note.status + '）')
    blockReason = PushBlockReason.NOT_REVIEWED
    blockDetail = '笔记需处于「已发布」状态才能推送，当前状态：' + note.status
  }

  if ([3, 4, 7].includes(Number(note.status))) {
    errors.push('笔记状态异常：拒绝/下架/限流')
    blockReason = PushBlockReason.STATUS_ABNORMAL
    blockDetail = '笔记当前状态不可推送'
  }

  if (note.flowUnlocked !== 1) {
    warnings.push('笔记尚未解锁流量分发权限')
  }

  if (note.violationType) {
    errors.push('笔记存在违规记录：' + note.violationType)
    blockReason = PushBlockReason.VIOLATION
    blockDetail = '违规类型：' + note.violationType
  }

  return { valid: errors.length === 0, warnings, errors, blockReason, blockDetail }
}

export function calculateMatchScore(note: any, pool: any, contentTags: any[] = []) {
  let tagScore = 0
  let interestScore = 0
  let profileScore = 0

  const poolLevel = Number(pool.poolLevel) || 1
  const tagWeight = 0.35
  const interestWeight = 0.35
  const profileWeight = 0.30

  if (contentTags.length > 0) {
    const coreTags = contentTags.filter(t => t.isCore === 1 || t.weight >= 50).length
    const baseScore = Math.min(contentTags.length * 8, 50)
    const bonusScore = Math.min(coreTags * 10, 50)
    tagScore = baseScore + bonusScore
  } else {
    tagScore = 40
  }

  interestScore = 50 + poolLevel * 12 + Math.floor(Math.random() * 20)
  interestScore = Math.min(interestScore, 100)

  const authorBonus = (Number(note.authorLevel) || 1) * 8
  const contentBonus = Number(note.flowLevel) * 6
  profileScore = 45 + authorBonus + contentBonus + Math.floor(Math.random() * 15)
  profileScore = Math.min(profileScore, 100)

  const totalScore = Number((tagScore * tagWeight + interestScore * interestWeight + profileScore * profileWeight).toFixed(2))
  const isPass = totalScore >= MIN_MATCH_SCORE

  return {
    tagScore: Number(tagScore.toFixed(2)),
    interestScore: Number(interestScore.toFixed(2)),
    profileScore: Number(profileScore.toFixed(2)),
    totalScore,
    isPass,
    minScore: MIN_MATCH_SCORE
  }
}

export function estimateTargetExposure(pool: any, strength: number) {
  const baseQuota = Number(pool.dailyQuota) || 100000
  const weightMultiplier = Number(pool.weightMultiplier) || 1
  const strengthMultiplier = {
    [ContentPushStrength.NORMAL]: 0.5,
    [ContentPushStrength.ENHANCED]: 1.0,
    [ContentPushStrength.AGGRESSIVE]: 1.8
  }[strength] || 0.5

  const estimate = Math.floor(baseQuota * weightMultiplier * strengthMultiplier * (0.05 + Math.random() * 0.05))
  return Math.max(1000, estimate)
}

export async function createTrace(data: {
  taskId: number
  noteId: number
  userId?: number
  eventType: string
  eventDetail?: string
  exposureAmount?: number
  clickAmount?: number
  interactAmount?: number
  anomalyType?: string
  anomalyDetail?: string
  anomalyScore?: number
  isBlocked?: number
  traceData?: any
  operatorId?: number
  operatorName?: string
  ip?: string
}) {
  return await ContentPushTrace.create({
    traceId: generateTraceId(),
    taskId: data.taskId,
    noteId: data.noteId,
    userId: data.userId || null,
    eventType: data.eventType,
    eventDetail: data.eventDetail || '',
    exposureAmount: data.exposureAmount || 0,
    clickAmount: data.clickAmount || 0,
    interactAmount: data.interactAmount || 0,
    ipAddress: data.ip || '',
    anomalyType: data.anomalyType || '',
    anomalyDetail: data.anomalyDetail || '',
    anomalyScore: data.anomalyScore || 0,
    isBlocked: data.isBlocked || 0,
    operatorId: data.operatorId || null,
    operatorName: data.operatorName || '',
    traceData: data.traceData ? JSON.stringify(data.traceData) : undefined
  })
}

export async function detectPushAnomalies(taskId: number) {
  const anomalies: Array<{ type: string; detail: string; score: number }> = []

  const oneHourAgo = dayjs().subtract(1, 'hour').toDate()
  const recentDeliveries = await ContentPushTrace.count({
    where: {
      taskId,
      eventType: PushTraceEventType.EXPOSURE_DELIVERED,
      createTime: { [Op.gte]: oneHourAgo }
    }
  })

  const validCount = await ContentPushTrace.count({
    where: {
      taskId,
      eventType: PushTraceEventType.EXPOSURE_VALID,
      createTime: { [Op.gte]: oneHourAgo }
    }
  })

  if (recentDeliveries > 0 && validCount / recentDeliveries < 0.4) {
    anomalies.push({
      type: PushTraceAnomalyType.INVALID_EXPOSURE,
      detail: `近1小时有效曝光率仅${(validCount / recentDeliveries * 100).toFixed(1)}%，低于阈值40%`,
      score: 75
    })
  }

  const ipGroup: any = await ContentPushTrace.findAll({
    where: {
      taskId,
      eventType: { [Op.in]: [PushTraceEventType.CLICK_TRACKED, PushTraceEventType.EXPOSURE_DELIVERED] },
      createTime: { [Op.gte]: oneHourAgo }
    },
    attributes: ['ipAddress', [fn('COUNT', col('id')), 'cnt']],
    group: ['ipAddress'],
    having: literal('cnt > 50')
  })

  if (ipGroup.length > 3) {
    anomalies.push({
      type: PushTraceAnomalyType.IP_CLUSTER,
      detail: `检测到${ipGroup.length}个IP存在密集操作，疑似刷量`,
      score: 85
    })
  }

  return anomalies
}

export async function list(params: any) {
  const {
    page = 1, pageSize = 20,
    keyword = '', poolId, poolLevel, pushStatus, pushStrength,
    authorId, noteId, startDate, endDate,
    minMatchScore, maxMatchScore,
    hasAnomaly
  } = params

  const where: any = {}
  if (keyword) {
    where[Op.or] = [
      { taskNo: { [Op.like]: `%${keyword}%` } },
      { noteTitle: { [Op.like]: `%${keyword}%` } },
      { authorName: { [Op.like]: `%${keyword}%` } }
    ]
  }
  if (poolId) where.poolId = Number(poolId)
  if (poolLevel) where.poolLevel = Number(poolLevel)
  if (pushStatus !== undefined && pushStatus !== '') where.pushStatus = Number(pushStatus)
  if (pushStrength) where.pushStrength = Number(pushStrength)
  if (authorId) where.authorId = Number(authorId)
  if (noteId) where.noteId = Number(noteId)
  if (startDate) where.createTime = { ...(where.createTime || {}), [Op.gte]: dayjs(startDate).startOf('day').toDate() }
  if (endDate) where.createTime = { ...(where.createTime || {}), [Op.lte]: dayjs(endDate).endOf('day').toDate() }
  if (minMatchScore) where.matchScore = { ...(where.matchScore || {}), [Op.gte]: Number(minMatchScore) }
  if (maxMatchScore) where.matchScore = { ...(where.matchScore || {}), [Op.lte]: Number(maxMatchScore) }
  if (hasAnomaly === '1' || hasAnomaly === 1) where.anomalyCount = { [Op.gt]: 0 }

  const { count, rows } = await ContentPushTask.findAndCountAll({
    where,
    order: [['createTime', 'DESC']],
    offset: (Number(page) - 1) * Number(pageSize),
    limit: Number(pageSize)
  })

  return { list: rows, total: count }
}

export async function detail(id: number) {
  const task = await ContentPushTask.findByPk(id)
  if (!task) throw new Error('推送任务不存在')
  return task
}

export async function validateCreateData(data: any, roles: string[]) {
  const perm = getPushPermission(roles)
  if (!perm.canCreate) {
    return { valid: false, errors: ['您没有创建推送任务的权限'], blockReason: 'no_permission' }
  }

  const note = await Note.findByPk(Number(data.noteId))
  if (!note) return { valid: false, errors: ['笔记不存在'], blockReason: 'note_not_found' }

  const noteValidation = validateNoteForPush(note)
  if (!noteValidation.valid) {
    return {
      valid: false,
      errors: noteValidation.errors,
      warnings: noteValidation.warnings,
      blockReason: noteValidation.blockReason,
      blockDetail: noteValidation.blockDetail
    }
  }

  const pool = await TrafficPool.findByPk(Number(data.poolId))
  if (!pool) return { valid: false, errors: ['流量池不存在'], blockReason: 'pool_not_found' }

  if (Number(pool.status) !== 1) {
    return { valid: false, errors: ['流量池未启用'], blockReason: PushBlockReason.POOL_NOT_MATCH, blockDetail: '流量池当前处于停用状态' }
  }

  if (Number(note.flowLevel) < Number(pool.poolLevel)) {
    return {
      valid: false,
      errors: [`笔记流量等级(${note.flowLevel})低于流量池等级(${pool.poolLevel})，无法准入`],
      blockReason: PushBlockReason.POOL_NOT_MATCH,
      blockDetail: '笔记流量等级低于流量池准入要求'
    }
  }

  const noteTags = await (note as any).getTags ? (await (note as any).getTags()) : []
  const match = calculateMatchScore(note, pool, noteTags)

  if (!match.isPass) {
    return {
      valid: false,
      errors: [`综合匹配度(${match.totalScore})低于阈值(${match.minScore})，禁止推送`],
      warnings: ['可优化内容标签、提升作者等级以提高匹配度'],
      blockReason: PushBlockReason.MATCH_INSUFFICIENT,
      blockDetail: `内容标签匹配${match.tagScore}，兴趣匹配${match.interestScore}，画像匹配${match.profileScore}`,
      matchScore: match
    }
  }

  if (Number(pool.remainingQuota) <= 0) {
    return {
      valid: false,
      errors: ['流量池剩余配额不足'],
      blockReason: PushBlockReason.QUOTA_EXCEEDED,
      blockDetail: `当前配额剩余${pool.remainingQuota}`
    }
  }

  const existingActive = await ContentPushTask.count({
    where: {
      noteId: note.id,
      pushStatus: { [Op.in]: [ContentPushStatus.PUSHING, ContentPushStatus.PAUSED] }
    }
  })

  if (existingActive > 0) {
    return {
      valid: false,
      errors: ['该笔记存在进行中的推送任务'],
      warnings: ['请先终止或等待现有推送结束'],
      blockReason: 'duplicate_push',
      blockDetail: `已存在${existingActive}个进行中任务`
    }
  }

  const targetExposure = estimateTargetExposure(pool, Number(data.pushStrength) || 1)

  return {
    valid: true,
    warnings: noteValidation.warnings,
    matchScore: match,
    note: { id: note.id, title: note.title, authorId: note.authorId, authorName: note.authorName },
    pool: { id: pool.id, poolName: pool.poolName, poolLevel: pool.poolLevel, remainingQuota: pool.remainingQuota },
    estimateTarget: targetExposure,
    contentTags: noteTags.map((t: any) => ({ id: t.id, name: t.name, isCore: t.isCore, weight: t.weight }))
  }
}

export async function create(data: any, roles: string[], operator: any) {
  const validation = await validateCreateData(data, roles)
  if (!validation.valid) {
    await ContentPushTask.create({
      taskNo: generateTaskNo(),
      noteId: Number(data.noteId),
      noteTitle: validation.note ? validation.note.title : '未知笔记',
      authorId: validation.note ? validation.note.authorId : 0,
      authorName: validation.note ? validation.note.authorName : '',
      poolId: Number(data.poolId),
      poolName: validation.pool ? validation.pool.poolName : '未知池',
      poolLevel: validation.pool ? validation.pool.poolLevel : 1,
      pushStatus: ContentPushStatus.BLOCKED,
      pushStrength: Number(data.pushStrength) || 1,
      targetExposure: 0,
      matchScore: validation.matchScore ? validation.matchScore.totalScore : 0,
      tagMatchScore: validation.matchScore ? validation.matchScore.tagScore : 0,
      interestMatchScore: validation.matchScore ? validation.matchScore.interestScore : 0,
      profileMatchScore: validation.matchScore ? validation.matchScore.profileScore : 0,
      blockReason: validation.blockReason || '',
      blockDetail: validation.blockDetail || (validation.errors || []).join('；'),
      operatorId: operator?.id || null,
      operatorName: operator?.nickname || operator?.username || ''
    })
    return { success: false, blocked: true, reason: (validation.errors || [])[0] || '校验失败', detail: validation.blockDetail }
  }

  const note = validation.note!
  const pool = validation.pool!
  const estimateTarget = validation.estimateTarget!
  const contentTags = validation.contentTags || []
  const matchScore = validation.matchScore!

  const task = await ContentPushTask.create({
    taskNo: generateTaskNo(),
    noteId: note.id,
    noteTitle: note.title,
    authorId: note.authorId,
    authorName: note.authorName,
    poolId: pool.id,
    poolName: pool.poolName,
    poolLevel: pool.poolLevel,
    pushStatus: ContentPushStatus.PENDING,
    pushStrength: Number(data.pushStrength) || 1,
    targetExposure: estimateTarget,
    matchScore: matchScore.totalScore,
    tagMatchScore: matchScore.tagScore,
    interestMatchScore: matchScore.interestScore,
    profileMatchScore: matchScore.profileScore,
    contentTags: JSON.stringify(contentTags),
    expectedEndTime: data.expectedEndTime ? dayjs(data.expectedEndTime).toDate() : dayjs().add(7, 'day').toDate(),
    operatorId: operator?.id || null,
    operatorName: operator?.nickname || operator?.username || ''
  })

  await createTrace({
    taskId: task.id, noteId: note.id,
    eventType: PushTraceEventType.MATCH_CHECK,
    eventDetail: '创建前匹配度校验通过，匹配度：' + matchScore.totalScore,
    traceData: { matchScore, contentTags, validation },
    operatorId: operator?.id, operatorName: operator?.nickname || operator?.username
  })

  return { success: true, taskId: task.id, taskNo: task.taskNo }
}

export async function startPush(id: number, roles: string[], operator: any) {
  const perm = getPushPermission(roles)
  if (!perm.canCreate && !perm.canEdit) throw new Error('403')

  const task = await ContentPushTask.findByPk(id)
  if (!task) throw new Error('任务不存在')
  if (task.pushStatus !== ContentPushStatus.PENDING && task.pushStatus !== ContentPushStatus.PAUSED) {
    throw new Error('当前状态不可启动推送')
  }

  const pool = await TrafficPool.findByPk(task.poolId)
  if (!pool || Number(pool.status) !== 1) throw new Error('流量池不可用')
  if (Number(pool.remainingQuota) <= 0) throw new Error('流量池剩余配额不足')

  const isResume = task.pushStatus === ContentPushStatus.PAUSED
  await task.update({
    pushStatus: ContentPushStatus.PUSHING,
    startTime: task.startTime || new Date(),
    pauseTime: isResume ? null : task.pauseTime,
    resumeTime: isResume ? new Date() : task.resumeTime,
    freezeExposure: 0,
    freezeClick: 0,
    freezeInteract: 0
  })

  await createTrace({
    taskId: task.id, noteId: task.noteId,
    eventType: isResume ? PushTraceEventType.PUSH_RESUME : PushTraceEventType.PUSH_START,
    eventDetail: isResume ? '恢复推送' : '启动推送',
    operatorId: operator?.id, operatorName: operator?.nickname || operator?.username
  })

  return { taskId: id, status: ContentPushStatus.PUSHING }
}

export async function pausePush(id: number, roles: string[], operator: any) {
  const perm = getPushPermission(roles)
  if (!perm.canPause) throw new Error('403')

  const task = await ContentPushTask.findByPk(id)
  if (!task) throw new Error('任务不存在')
  if (task.pushStatus !== ContentPushStatus.PUSHING) throw new Error('当前状态不可暂停')

  await task.update({
    pushStatus: ContentPushStatus.PAUSED,
    pauseTime: new Date(),
    freezeExposure: task.currentExposure,
    freezeClick: task.clickCount,
    freezeInteract: task.interactCount
  })

  await createTrace({
    taskId: task.id, noteId: task.noteId,
    eventType: PushTraceEventType.PUSH_PAUSE,
    eventDetail: '暂停推送，冻结数据：曝光=' + task.currentExposure,
    traceData: { freezeExposure: task.currentExposure, freezeClick: task.clickCount, freezeInteract: task.interactCount },
    operatorId: operator?.id, operatorName: operator?.nickname || operator?.username
  })

  return { taskId: id, status: ContentPushStatus.PAUSED }
}

export async function terminatePush(id: number, roles: string[], operator: any, reason?: string) {
  const perm = getPushPermission(roles)
  if (!perm.canTerminate) throw new Error('403')

  const task = await ContentPushTask.findByPk(id)
  if (!task) throw new Error('任务不存在')
  if (task.pushStatus === ContentPushStatus.TERMINATED || task.pushStatus === ContentPushStatus.FINISHED || task.pushStatus === ContentPushStatus.BLOCKED) {
    throw new Error('当前状态不可终止')
  }

  await task.update({
    pushStatus: ContentPushStatus.TERMINATED,
    finishTime: new Date(),
    blockDetail: reason || '手动终止'
  })

  await createTrace({
    taskId: task.id, noteId: task.noteId,
    eventType: PushTraceEventType.PUSH_TERMINATE,
    eventDetail: '终止推送：' + (reason || '手动操作'),
    operatorId: operator?.id, operatorName: operator?.nickname || operator?.username
  })

  return { taskId: id, status: ContentPushStatus.TERMINATED }
}

export async function adjustStrength(id: number, strength: number, roles: string[], operator: any) {
  const perm = getPushPermission(roles)
  if (!perm.canAdjustStrength) throw new Error('403')

  const task = await ContentPushTask.findByPk(id)
  if (!task) throw new Error('任务不存在')
  if (task.pushStatus !== ContentPushStatus.PUSHING && task.pushStatus !== ContentPushStatus.PAUSED) {
    throw new Error('当前状态不可调整力度')
  }

  const oldStrength = task.pushStrength
  await task.update({ pushStrength: strength })

  await createTrace({
    taskId: task.id, noteId: task.noteId,
    eventType: PushTraceEventType.STRENGTH_CHANGE,
    eventDetail: `推送力度调整：${oldStrength} → ${strength}`,
    operatorId: operator?.id, operatorName: operator?.nickname || operator?.username
  })

  return { taskId: id, oldStrength, newStrength: strength }
}

export async function batchOperation(data: {
  operation: 'start' | 'pause' | 'terminate' | 'strengthen' | 'downgrade' | 'enhance'
  ids: number[]
  reason?: string
  targetStrength?: number
  filter?: any
}, roles: string[], operator: any) {
  const perm = getPushPermission(roles)
  if (!perm.canBatch) throw new Error('403')

  let ids = data.ids || []
  if (!ids.length && data.filter) {
    const where: any = {}
    if (data.filter.poolLevel) where.poolLevel = Number(data.filter.poolLevel)
    if (data.filter.pushStatus !== undefined && data.filter.pushStatus !== '') where.pushStatus = Number(data.filter.pushStatus)
    if (data.filter.minMatchScore) where.matchScore = { [Op.gte]: Number(data.filter.minMatchScore) }
    if (data.filter.maxMatchScore) where.matchScore = { [Op.lte]: Number(data.filter.maxMatchScore) }
    const rows = await ContentPushTask.findAll({ where, attributes: ['id'] })
    ids = rows.map(r => r.id)
  }

  const results: Array<{ id: number; success: boolean; error?: string }> = []
  let success = 0, fail = 0

  for (const id of ids) {
    try {
      switch (data.operation) {
        case 'start':
          await startPush(id, roles, operator); break
        case 'pause':
          await pausePush(id, roles, operator); break
        case 'terminate':
          await terminatePush(id, roles, operator, data.reason); break
        case 'strengthen':
        case 'downgrade':
        case 'enhance':
          let target = data.targetStrength
          if (!target) {
            const task = await ContentPushTask.findByPk(id)
            if (data.operation === 'strengthen') target = Math.min(3, (task?.pushStrength || 1) + 1)
            else if (data.operation === 'downgrade') target = Math.max(1, (task?.pushStrength || 2) - 1)
            else target = 3
          }
          await adjustStrength(id, target!, roles, operator); break
      }
      success++
      results.push({ id, success: true })
    } catch (e: any) {
      fail++
      results.push({ id, success: false, error: e.message || '操作失败' })
    }
  }

  return { total: ids.length, success, fail, results }
}

export async function refreshStats(id: number) {
  const task = await ContentPushTask.findByPk(id)
  if (!task) throw new Error('任务不存在')
  if (task.pushStatus !== ContentPushStatus.PUSHING) return { skipped: true }

  const todayStart = dayjs().startOf('day').toDate()
  const exposed = await ContentPushTrace.count({
    where: { taskId: id, eventType: PushTraceEventType.EXPOSURE_DELIVERED, createTime: { [Op.gte]: todayStart } }
  })
  const clicks = await ContentPushTrace.count({
    where: { taskId: id, eventType: PushTraceEventType.CLICK_TRACKED, createTime: { [Op.gte]: todayStart } }
  })
  const interacts = await ContentPushTrace.count({
    where: { taskId: id, eventType: PushTraceEventType.INTERACT_TRACKED, createTime: { [Op.gte]: todayStart } }
  })

  const anomalies = await detectPushAnomalies(id)
  if (anomalies.length > 0) {
    for (const a of anomalies) {
      await createTrace({
        taskId: id, noteId: task.noteId,
        eventType: PushTraceEventType.ANOMALY_DETECTED,
        eventDetail: a.detail,
        anomalyType: a.type,
        anomalyScore: a.score,
        isBlocked: a.score >= 80 ? 1 : 0
      })
    }
  }

  const anomalyBlocked = anomalies.some(a => a.score >= 80)

  await task.update({
    currentExposure: Number(task.currentExposure) + exposed,
    realExposure: Number(task.realExposure) + Math.floor(exposed * (0.85 + Math.random() * 0.1)),
    clickCount: Number(task.clickCount) + clicks,
    interactCount: Number(task.interactCount) + interacts,
    anomalyCount: Number(task.anomalyCount) + anomalies.length,
    lastDataRefreshTime: new Date(),
    anomalyFlags: anomalies.length > 0 ? JSON.stringify(anomalies) : task.anomalyFlags
  })

  if (anomalyBlocked) {
    anomalies.filter(a => a.score >= 80).forEach(a => {
      createTrace({
        taskId: id, noteId: task.noteId,
        eventType: PushTraceEventType.ANOMALY_BLOCKED,
        eventDetail: '异常已拦截：' + a.detail,
        anomalyType: a.type, anomalyScore: a.score, isBlocked: 1
      })
    })
  }

  return { exposed, clicks, interacts, anomalies: anomalies.length }
}

export async function getPushStats() {
  const statusGroup: any = await ContentPushTask.findAll({
    attributes: ['pushStatus', [fn('COUNT', col('id')), 'cnt']],
    group: ['pushStatus']
  })

  const total = await ContentPushTask.count()
  const todayStart = dayjs().startOf('day').toDate()
  const todayCreated = await ContentPushTask.count({ where: { createTime: { [Op.gte]: todayStart } } })

  const expSum: any = await ContentPushTask.findOne({
    attributes: [[fn('SUM', col('currentExposure')), 'totalExp'], [fn('SUM', col('clickCount')), 'totalClick']]
  })

  const statusMap: Record<number, number> = {}
  statusGroup.forEach((s: any) => { statusMap[Number(s.pushStatus)] = Number(s.get('cnt')) })

  return {
    total,
    todayCreated,
    statusMap,
    totalExposure: Number(expSum?.get('totalExp') || 0),
    totalClick: Number(expSum?.get('totalClick') || 0),
    clickRate: Number(expSum?.get('totalExp') || 0) > 0
      ? Number((Number(expSum?.get('totalClick') || 0) / Number(expSum?.get('totalExp') || 0) * 100).toFixed(2))
      : 0
  }
}

export async function listTraces(params: any) {
  const {
    page = 1, pageSize = 20, taskId, noteId, userId, eventType, isBlocked, anomalyType,
    startDate, endDate, keyword
  } = params

  const where: any = {}
  if (taskId) where.taskId = Number(taskId)
  if (noteId) where.noteId = Number(noteId)
  if (userId) where.userId = Number(userId)
  if (eventType) where.eventType = eventType
  if (isBlocked !== undefined && isBlocked !== '') where.isBlocked = Number(isBlocked)
  if (anomalyType) where.anomalyType = anomalyType
  if (startDate) where.createTime = { ...(where.createTime || {}), [Op.gte]: dayjs(startDate).startOf('day').toDate() }
  if (endDate) where.createTime = { ...(where.createTime || {}), [Op.lte]: dayjs(endDate).endOf('day').toDate() }
  if (keyword) {
    where[Op.or] = [
      { traceId: { [Op.like]: `%${keyword}%` } },
      { eventDetail: { [Op.like]: `%${keyword}%` } },
      { anomalyDetail: { [Op.like]: `%${keyword}%` } }
    ]
  }

  const { count, rows } = await ContentPushTrace.findAndCountAll({
    where,
    order: [['createTime', 'DESC']],
    offset: (Number(page) - 1) * Number(pageSize),
    limit: Number(pageSize)
  })

  return { list: rows, total: count }
}

export async function getFullChain(taskId: number) {
  const task = await ContentPushTask.findByPk(taskId)
  if (!task) throw new Error('任务不存在')

  const traces = await ContentPushTrace.findAll({
    where: { taskId },
    order: [['createTime', 'ASC']]
  })

  const eventGroups: Record<string, number> = {}
  const anomalyList: any[] = []
  traces.forEach((t: any) => {
    eventGroups[t.eventType] = (eventGroups[t.eventType] || 0) + 1
    if (t.anomalyType || t.isBlocked === 1) anomalyList.push(t)
  })

  const exposureChain = traces.filter((t: any) =>
    [PushTraceEventType.EXPOSURE_DELIVERED, PushTraceEventType.EXPOSURE_VALID, PushTraceEventType.EXPOSURE_INVALID].includes(t.eventType as any)
  )

  const validExposure = exposureChain.filter((t: any) => t.eventType === PushTraceEventType.EXPOSURE_VALID).length
  const deliveredExposure = exposureChain.filter((t: any) => t.eventType === PushTraceEventType.EXPOSURE_DELIVERED).length

  return {
    task,
    eventTimeline: traces,
    eventGroups,
    anomalyList,
    coverage: {
      delivered: deliveredExposure,
      valid: validExposure,
      invalid: exposureChain.filter((t: any) => t.eventType === PushTraceEventType.EXPOSURE_INVALID).length,
      validRate: deliveredExposure > 0 ? Number((validExposure / deliveredExposure * 100).toFixed(2)) : 0
    },
    reachAccuracy: {
      score: Number(((validExposure / (deliveredExposure || 1)) * 80 + (task.matchScore / 100) * 20).toFixed(2)),
      matchScore: task.matchScore
    }
  }
}
