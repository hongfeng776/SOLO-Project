import { Op } from 'sequelize'
import { Note, BehaviorLog, Creator } from '@models/index'

export enum InteractionType {
  LIKE = 'like',
  FAVORITE = 'favorite',
  SHARE = 'share',
  COMMENT = 'comment',
  VIEW = 'view',
  FOLLOW = 'follow',
  ALL = 'all'
}

export enum InteractionAbnormalType {
  RAPID_SURGE = 'rapid_surge',
  FAKE_INTERACTION = 'fake_interaction',
  MACHINE_BRUSH = 'machine_brush',
  NO_USER_TRACE = 'no_user_trace',
  REPEAT_INTERACTION = 'repeat_interaction',
  IP_CONCENTRATED = 'ip_concentrated',
  LOW_QUALITY = 'low_quality',
  ABNORMAL_RATIO = 'abnormal_ratio'
}

export const INTERACTION_ABNORMAL_TYPE_NAMES: Record<string, string> = {
  [InteractionAbnormalType.RAPID_SURGE]: '互动数据暴涨',
  [InteractionAbnormalType.FAKE_INTERACTION]: '虚假互动',
  [InteractionAbnormalType.MACHINE_BRUSH]: '机器刷量',
  [InteractionAbnormalType.NO_USER_TRACE]: '无用户轨迹',
  [InteractionAbnormalType.REPEAT_INTERACTION]: '重复互动',
  [InteractionAbnormalType.IP_CONCENTRATED]: 'IP集中',
  [InteractionAbnormalType.LOW_QUALITY]: '低质量互动',
  [InteractionAbnormalType.ABNORMAL_RATIO]: '互动比例异常'
}

export const INTERACTION_TYPE_NAMES: Record<string, string> = {
  [InteractionType.LIKE]: '点赞',
  [InteractionType.FAVORITE]: '收藏',
  [InteractionType.SHARE]: '转发',
  [InteractionType.COMMENT]: '评论',
  [InteractionType.VIEW]: '浏览',
  [InteractionType.FOLLOW]: '关注',
  [InteractionType.ALL]: '全部'
}

export const RAPID_SURGE_THRESHOLD = {
  like: 50,
  favorite: 30,
  share: 20,
  comment: 15,
  view: 200
}

export const SURGE_WINDOW_MINUTES = 10

export const HOURLY_BRUSH_THRESHOLD = 200
export const DAILY_BRUSH_THRESHOLD = 1000

export interface InteractionCheckResult {
  isAbnormal: boolean
  abnormalTypes: string[]
  abnormalDetails: Array<{
    type: string
    typeName: string
    severity: number
    reason: string
    abnormalCount: number
    relatedUserIds?: number[]
    relatedIps?: string[]
  }>
  riskLevel: number
  totalAbnormalCount: number
  qualityScore: number
  suggestions: string[]
}

export interface InteractionStats {
  likeCount: number
  favoriteCount: number
  shareCount: number
  commentCount: number
  viewCount: number
  totalInteraction: number
  likeGrowth: number
  favoriteGrowth: number
  shareGrowth: number
  commentGrowth: number
  viewGrowth: number
}

export const interactionComplianceService = {
  async getInteractionStats(noteId: number): Promise<InteractionStats> {
    const note = await Note.findByPk(noteId)
    if (!note) {
      return {
        likeCount: 0, favoriteCount: 0, shareCount: 0, commentCount: 0, viewCount: 0,
        totalInteraction: 0, likeGrowth: 0, favoriteGrowth: 0, shareGrowth: 0,
        commentGrowth: 0, viewGrowth: 0
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const behaviorLogs = await BehaviorLog.findAll({
      where: { targetId: noteId, targetType: 'note', createTime: { [Op.gte]: oneHourAgo } },
      attributes: ['behaviorType']
    })

    const countByType = (type: string) =>
      behaviorLogs.filter(log => log.behaviorType === type).length

    return {
      likeCount: note.likeCount || 0,
      favoriteCount: note.favoriteCount || 0,
      shareCount: note.shareCount || 0,
      commentCount: note.commentCount || 0,
      viewCount: note.viewCount || 0,
      totalInteraction: (note.likeCount || 0) + (note.favoriteCount || 0) + (note.shareCount || 0) + (note.commentCount || 0),
      likeGrowth: countByType('like'),
      favoriteGrowth: countByType('favorite'),
      shareGrowth: countByType('share'),
      commentGrowth: countByType('comment'),
      viewGrowth: countByType('view')
    }
  },

  async checkRapidSurge(noteId: number): Promise<{
    isAbnormal: boolean
    details: Array<{ type: string; typeName: string; count: number; threshold: number }>
  }> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - SURGE_WINDOW_MINUTES * 60 * 1000)

    const logs = await BehaviorLog.findAll({
      where: { targetId: noteId, targetType: 'note', createTime: { [Op.gte]: windowStart } },
      attributes: ['behaviorType', 'userId', 'ip', 'createTime']
    })

    const details: Array<{ type: string; typeName: string; count: number; threshold: number }> = []

    for (const type of Object.values(InteractionType)) {
      if (type === InteractionType.ALL) continue
      const count = logs.filter(log => log.behaviorType === type).length
      const threshold = (RAPID_SURGE_THRESHOLD as any)[type] || 50
      if (count > threshold) {
        details.push({ type, typeName: INTERACTION_TYPE_NAMES[type], count, threshold })
      }
    }

    return { isAbnormal: details.length > 0, details }
  },

  async checkMachineBrush(noteId: number): Promise<{
    isAbnormal: boolean
    abnormalUsers: Array<{ userId: number; count: number; type: string }>
    abnormalIps: Array<{ ip: string; count: number }>
  }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const logs = await BehaviorLog.findAll({
      where: { targetId: noteId, targetType: 'note', createTime: { [Op.gte]: oneHourAgo } },
      attributes: ['userId', 'userName', 'ip', 'behaviorType']
    })

    const userCountMap = new Map<string, number>()
    const ipCountMap = new Map<string, number>()

    for (const log of logs) {
      const key = `${log.userId}-${log.behaviorType}`
      userCountMap.set(key, (userCountMap.get(key) || 0) + 1)
      if (log.ip) {
        ipCountMap.set(log.ip, (ipCountMap.get(log.ip) || 0) + 1)
      }
    }

    const abnormalUsers: Array<{ userId: number; count: number; type: string }> = []
    for (const [key, count] of userCountMap.entries()) {
      if (count >= 10) {
        const [userId, type] = key.split('-')
        abnormalUsers.push({ userId: Number(userId), count, type })
      }
    }

    const abnormalIps: Array<{ ip: string; count: number }> = []
    for (const [ip, count] of ipCountMap.entries()) {
      if (count >= 30) {
        abnormalIps.push({ ip, count })
      }
    }

    return { isAbnormal: abnormalUsers.length > 0 || abnormalIps.length > 0, abnormalUsers, abnormalIps }
  },

  async checkRepeatInteraction(noteId: number): Promise<{
    isAbnormal: boolean
    repeatRecords: Array<{ userId: number; type: string; count: number; interval: number }>
  }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const logs = await BehaviorLog.findAll({
      where: { targetId: noteId, targetType: 'note', createTime: { [Op.gte]: oneHourAgo } },
      order: [['createTime', 'ASC']]
    })

    const userTypeMap = new Map<string, Array<Date>>()
    for (const log of logs) {
      const key = `${log.userId}-${log.behaviorType}`
      if (!userTypeMap.has(key)) userTypeMap.set(key, [])
      userTypeMap.get(key)!.push(new Date(log.createTime))
    }

    const repeatRecords: Array<{ userId: number; type: string; count: number; interval: number }> = []
    for (const [key, times] of userTypeMap.entries()) {
      if (times.length >= 3) {
        const [userId, type] = key.split('-')
        const intervals: number[] = []
        for (let i = 1; i < times.length; i++) {
          intervals.push(times[i].getTime() - times[i - 1].getTime())
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
        if (avgInterval < 2000) {
          repeatRecords.push({ userId: Number(userId), type, count: times.length, interval: Math.round(avgInterval) })
        }
      }
    }

    return { isAbnormal: repeatRecords.length > 0, repeatRecords }
  },

  async checkNoUserTrace(noteId: number): Promise<{
    isAbnormal: boolean
    noTraceCount: number
    noTraceUserIds: number[]
  }> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const logs = await BehaviorLog.findAll({
      where: { targetId: noteId, targetType: 'note', createTime: { [Op.gte]: twoHoursAgo } },
      attributes: ['userId', 'userName', 'behaviorType', 'ip', 'userAgent', 'isAbnormal', 'intercepted']
    })

    const userBehaviorMap = new Map<number, { count: number; types: Set<string>; hasDetail: boolean; ip: string; ua: string }>()

    for (const log of logs) {
      const existing = userBehaviorMap.get(log.userId) || {
        count: 0, types: new Set(), hasDetail: false, ip: log.ip || '', ua: log.userAgent || ''
      }
      existing.count++
      existing.types.add(log.behaviorType)
      if (log.ip && log.userAgent) existing.hasDetail = true
      userBehaviorMap.set(log.userId, existing)
    }

    const noTraceUserIds: number[] = []
    for (const [userId, info] of userBehaviorMap.entries()) {
      if (!info.hasDetail || info.types.size === 1) {
        if (info.count >= 5) {
          noTraceUserIds.push(userId)
        }
      }
    }

    return { isAbnormal: noTraceUserIds.length > 0, noTraceCount: noTraceUserIds.length, noTraceUserIds }
  },

  async checkAbnormalRatio(noteId: number): Promise<{
    isAbnormal: boolean
    ratio: number
    reason: string
  }> {
    const note = await Note.findByPk(noteId)
    if (!note || note.viewCount < 100) {
      return { isAbnormal: false, ratio: 0, reason: '数据量不足，暂不检测' }
    }

    const likeRatio = note.viewCount > 0 ? note.likeCount / note.viewCount : 0
    const commentRatio = note.viewCount > 0 ? note.commentCount / note.viewCount : 0
    const shareRatio = note.viewCount > 0 ? note.shareCount / note.viewCount : 0

    let isAbnormal = false
    let reason = ''

    if (likeRatio > 0.8) {
      isAbnormal = true
      reason = `点赞率异常偏高：${(likeRatio * 100).toFixed(1)}%（正常范围 3%-30%）`
    } else if (commentRatio > 0.3) {
      isAbnormal = true
      reason = `评论率异常偏高：${(commentRatio * 100).toFixed(1)}%（正常范围 0.5%-10%）`
    } else if (shareRatio > 0.2) {
      isAbnormal = true
      reason = `转发率异常偏高：${(shareRatio * 100).toFixed(1)}%（正常范围 0.1%-5%）`
    }

    return { isAbnormal, ratio: likeRatio, reason: reason || '互动比例正常' }
  },

  async fullCheck(noteId: number): Promise<InteractionCheckResult> {
    const abnormalDetails: InteractionCheckResult['abnormalDetails'] = []
    const suggestions: string[] = []

    const surgeResult = await this.checkRapidSurge(noteId)
    if (surgeResult.isAbnormal) {
      for (const d of surgeResult.details) {
        abnormalDetails.push({
          type: InteractionAbnormalType.RAPID_SURGE,
          typeName: INTERACTION_ABNORMAL_TYPE_NAMES[InteractionAbnormalType.RAPID_SURGE],
          severity: d.count > d.threshold * 3 ? 3 : (d.count > d.threshold * 2 ? 2 : 1),
          reason: `${d.typeName}${SURGE_WINDOW_MINUTES}分钟内新增${d.count}次，阈值${d.threshold}`,
          abnormalCount: d.count
        })
      }
      suggestions.push('短时间互动数据暴涨，建议人工复核确认是否为刷量')
    }

    const machineResult = await this.checkMachineBrush(noteId)
    if (machineResult.isAbnormal) {
      const totalCount = machineResult.abnormalUsers.reduce((sum, u) => sum + u.count, 0)
      abnormalDetails.push({
        type: InteractionAbnormalType.MACHINE_BRUSH,
        typeName: INTERACTION_ABNORMAL_TYPE_NAMES[InteractionAbnormalType.MACHINE_BRUSH],
        severity: machineResult.abnormalUsers.length >= 5 ? 3 : 2,
        reason: `检测到${machineResult.abnormalUsers.length}个疑似机器刷量账号，${machineResult.abnormalIps.length}个集中IP`,
        abnormalCount: totalCount,
        relatedUserIds: machineResult.abnormalUsers.map(u => u.userId),
        relatedIps: machineResult.abnormalIps.map(i => i.ip)
      })
      suggestions.push('存在机器刷量特征，建议清理虚假互动数据')
    }

    const repeatResult = await this.checkRepeatInteraction(noteId)
    if (repeatResult.isAbnormal) {
      const totalCount = repeatResult.repeatRecords.reduce((sum, r) => sum + r.count, 0)
      abnormalDetails.push({
        type: InteractionAbnormalType.REPEAT_INTERACTION,
        typeName: INTERACTION_ABNORMAL_TYPE_NAMES[InteractionAbnormalType.REPEAT_INTERACTION],
        severity: 2,
        reason: `检测到${repeatResult.repeatRecords.length}个账号存在重复互动行为，平均间隔低于2秒`,
        abnormalCount: totalCount,
        relatedUserIds: repeatResult.repeatRecords.map(r => r.userId)
      })
      suggestions.push('存在重复互动，建议校准数据')
    }

    const noTraceResult = await this.checkNoUserTrace(noteId)
    if (noTraceResult.isAbnormal) {
      abnormalDetails.push({
        type: InteractionAbnormalType.NO_USER_TRACE,
        typeName: INTERACTION_ABNORMAL_TYPE_NAMES[InteractionAbnormalType.NO_USER_TRACE],
        severity: 2,
        reason: `${noTraceResult.noTraceCount}个账号无真实用户轨迹特征`,
        abnormalCount: noTraceResult.noTraceCount,
        relatedUserIds: noTraceResult.noTraceUserIds
      })
      suggestions.push('部分互动账号行为异常，建议进一步核实')
    }

    const ratioResult = await this.checkAbnormalRatio(noteId)
    if (ratioResult.isAbnormal) {
      abnormalDetails.push({
        type: InteractionAbnormalType.ABNORMAL_RATIO,
        typeName: INTERACTION_ABNORMAL_TYPE_NAMES[InteractionAbnormalType.ABNORMAL_RATIO],
        severity: 1,
        reason: ratioResult.reason,
        abnormalCount: 0
      })
      suggestions.push('互动比例异常，建议关注后续数据变化')
    }

    let riskLevel = 0
    if (abnormalDetails.length > 0) {
      riskLevel = Math.max(...abnormalDetails.map(d => d.severity))
      if (abnormalDetails.length >= 3) riskLevel = 3
    }

    const totalAbnormalCount = abnormalDetails.reduce((sum, d) => sum + d.abnormalCount, 0)

    const baseScore = 100
    const qualityScore = Math.max(0, Math.min(100, baseScore - totalAbnormalCount * 0.5 - riskLevel * 10))

    return {
      isAbnormal: abnormalDetails.length > 0,
      abnormalTypes: abnormalDetails.map(d => d.type),
      abnormalDetails,
      riskLevel,
      totalAbnormalCount,
      qualityScore,
      suggestions
    }
  },

  async checkCreatorQuality(authorId: number): Promise<{ qualityScore: number; riskLevel: number; reasons: string[] }> {
    const reasons: string[] = []
    let score = 75

    const creator = await Creator.findOne({ where: { id: authorId } })
    if (creator && (creator as any).accountWeight) {
      score = (creator as any).accountWeight
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const abnormalLogs = await BehaviorLog.count({
      where: { userId: authorId, isAbnormal: 1, createTime: { [Op.gte]: oneWeekAgo } }
    })

    if (abnormalLogs > 10) {
      score -= 20
      reasons.push('近7日存在多次异常行为记录')
    } else if (abnormalLogs > 3) {
      score -= 10
      reasons.push('近7日存在少量异常行为记录')
    }

    const riskLevel = score >= 80 ? 0 : (score >= 60 ? 1 : (score >= 40 ? 2 : 3))
    if (score >= 80) reasons.unshift('创作者账号质量良好')

    return { qualityScore: Math.max(0, Math.min(100, score)), riskLevel, reasons }
  }
}

export default interactionComplianceService
