import { Op, Transaction } from 'sequelize'
import { Note, InteractionAbnormalLog, InteractionAuditLog, BehaviorLog, Creator } from '@models/index'
import { AppError } from '@utils/response'
import sequelize from '@config/database'
import interactionComplianceService, { InteractionAbnormalType, INTERACTION_ABNORMAL_TYPE_NAMES, InteractionType, INTERACTION_TYPE_NAMES } from './interaction-compliance'
import { FlowLevel } from '@/enums/note-ops'

export enum InteractionAuditAction {
  CALIBRATE = 'calibrate',
  CLEAN = 'clean',
  MARK_QUALITY = 'mark_quality',
  DEMOTE = 'demote',
  PROMOTE = 'promote',
  BATCH_CALIBRATE = 'batch_calibrate',
  BATCH_CLEAN = 'batch_clean',
  BATCH_MARK_QUALITY = 'batch_mark_quality',
  AUTO_CHECK = 'auto_check'
}

export const INTERACTION_AUDIT_ACTION_NAMES: Record<string, string> = {
  [InteractionAuditAction.CALIBRATE]: '数据校准',
  [InteractionAuditAction.CLEAN]: '数据清理',
  [InteractionAuditAction.MARK_QUALITY]: '标记优质',
  [InteractionAuditAction.DEMOTE]: '降权',
  [InteractionAuditAction.PROMOTE]: '提权',
  [InteractionAuditAction.BATCH_CALIBRATE]: '批量校准',
  [InteractionAuditAction.BATCH_CLEAN]: '批量清理',
  [InteractionAuditAction.BATCH_MARK_QUALITY]: '批量标记优质',
  [InteractionAuditAction.AUTO_CHECK]: '自动检测'
}

export enum InteractionAbnormalStatus {
  PENDING = 0,
  CALIBRATED = 1,
  CLEANED = 2,
  IGNORED = 3,
  REVIEW = 4
}

export const INTERACTION_ABNORMAL_STATUS_NAMES: Record<number, string> = {
  [InteractionAbnormalStatus.PENDING]: '待处理',
  [InteractionAbnormalStatus.CALIBRATED]: '已校准',
  [InteractionAbnormalStatus.CLEANED]: '已清理',
  [InteractionAbnormalStatus.IGNORED]: '已忽略',
  [InteractionAbnormalStatus.REVIEW]: '待复核'
}

export interface InteractionNoteItem {
  id: number
  title: string
  coverImage: string
  authorId: number
  authorName: string
  status: number
  likeCount: number
  favoriteCount: number
  shareCount: number
  commentCount: number
  viewCount: number
  totalInteraction: number
  interactionQuality: number
  abnormalInteraction: number
  isQualityInteraction: number
  riskLevel: number
  abnormalTypes: string
  flowLevel: number
  isHot: number
  lastInteractionCheckTime?: Date
  lastOpsTime?: Date
  createTime: Date
  updateTime: Date
}

export interface InteractionTraceResult {
  note: InteractionNoteItem
  abnormalRecords: InteractionAbnormalLog[]
  behaviorStats: {
    total: number
    byType: Record<string, number>
    byHour: Array<{ hour: string; count: number }>
    byIp: Array<{ ip: string; count: number }>
    byUser: Array<{ userId: number; userName: string; count: number }>
  }
  qualityAnalysis: {
    qualityScore: number
    riskLevel: number
    realUserRatio: number
    abnormalRatio: number
    suggestions: string[]
  }
  auditLogs: InteractionAuditLog[]
  creatorInfo: {
    id: number
    nickname: string
    qualityScore: number
    riskLevel: number
    reasons: string[]
  } | null
}

export interface InteractionReportItem {
  noteId: number
  noteTitle: string
  authorId: number
  authorName: string
  totalInteraction: number
  abnormalCount: number
  realInteraction: number
  qualityScore: number
  riskLevel: number
  abnormalTypes: string[]
  flowLevel: number
  growthTrend: string
  createTime: string
}

export const interactionService = {
  async getNoteList(params: {
    page: number
    pageSize: number
    keyword?: string
    status?: number
    riskLevel?: number
    abnormalType?: string
    isQuality?: number
    authorId?: number
    minInteraction?: number
    startTime?: string
    endTime?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<{ list: InteractionNoteItem[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, keyword, status, riskLevel, abnormalType, isQuality, authorId, minInteraction, startTime, endTime, sortBy, sortOrder } = params

    const where: any = {}
    if (status !== undefined) where.status = status
    if (isQuality !== undefined) where.isQualityInteraction = isQuality
    if (authorId) where.authorId = authorId
    if (keyword) where.title = { [Op.like]: `%${keyword}%` }
    if (startTime) where.createTime = { ...(where.createTime || {} }, [Op.gte]: new Date(startTime) }
    if (endTime) where.createTime = { ...(where.createTime || {}), [Op.lte]: new Date(endTime) }
    if (minInteraction) {
      where[Op.and] = [
        sequelize.literal(`(like_count + favorite_count + share_count + comment_count) >= ${minInteraction}`)
      ]
    }

    const order: any[] = []
    if (sortBy && sortOrder) {
      order.push([sortBy, sortOrder])
    } else {
      order.push(['create_time', 'DESC'])
    }

    const { count, rows } = await Note.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order,
      attributes: [
        'id', 'title', 'coverImage', 'authorId', 'authorName', 'status',
        'likeCount', 'favoriteCount', 'shareCount', 'commentCount', 'viewCount',
        'interactionQuality', 'abnormalInteraction', 'isQualityInteraction',
        'flowLevel', 'isHot', 'lastInteractionCheckTime', 'lastOpsTime', 'createTime', 'updateTime'
      ]
    })

    const list = await Promise.all(
      rows.map(async (note) => {
        const abnormalLogs = await InteractionAbnormalLog.findAll({
          where: { noteId: note.id, status: InteractionAbnormalStatus.PENDING },
          attributes: ['abnormalType', 'severity', 'riskLevel']
        })
        const abnormalTypes = [...new Set(abnormalLogs.map(l => l.abnormalType))].join(',')
        const maxRiskLevel = abnormalLogs.length > 0 ? Math.max(...abnormalLogs.map(l => l.riskLevel)) : 0
        const totalInteraction = note.likeCount + note.favoriteCount + note.shareCount + note.commentCount

        return {
          id: note.id,
          title: note.title,
          coverImage: note.coverImage,
          authorId: note.authorId,
          authorName: note.authorName,
          status: note.status,
          likeCount: note.likeCount,
          favoriteCount: note.favoriteCount,
          shareCount: note.shareCount,
          commentCount: note.commentCount,
          viewCount: note.viewCount,
          totalInteraction,
          interactionQuality: Number(note.interactionQuality) || 0,
          abnormalInteraction: note.abnormalInteraction || 0,
          isQualityInteraction: note.isQualityInteraction,
          riskLevel: maxRiskLevel,
          abnormalTypes,
          flowLevel: note.flowLevel,
          isHot: note.isHot,
          lastInteractionCheckTime: note.lastInteractionCheckTime,
          lastOpsTime: note.lastOpsTime,
          createTime: note.createTime,
          updateTime: note.updateTime
        } as InteractionNoteItem
      })
    )

    const filteredList = riskLevel !== undefined
      ? list.filter(item => item.riskLevel === riskLevel)
      : list

    const filteredByAbnormal = abnormalType
      ? filteredList.filter(item => item.abnormalTypes.includes(abnormalType))
      : filteredList

    return {
      list: filteredByAbnormal,
      total: count,
      page,
      pageSize
    }
  },

  async getDetail(noteId: number): Promise<any> {
    const note = await Note.findByPk(noteId)
    if (!note) throw new AppError('笔记不存在', 404)

    const checkResult = await interactionComplianceService.fullCheck(noteId)
    const abnormalLogs = await InteractionAbnormalLog.findAll({
      where: { noteId },
      order: [['create_time', 'DESC']],
      limit: 50
    })

    const totalInteraction = note.likeCount + note.favoriteCount + note.shareCount + note.commentCount
    const abnormalCount = abnormalLogs.filter(l => l.status === InteractionAbnormalStatus.PENDING).reduce((sum, l) => sum + l.abnormalCount, 0)

    return {
      note: {
        id: note.id,
        title: note.title,
        coverImage: note.coverImage,
        authorId: note.authorId,
        authorName: note.authorName,
        status: note.status,
        likeCount: note.likeCount,
        favoriteCount: note.favoriteCount,
        shareCount: note.shareCount,
        commentCount: note.commentCount,
        viewCount: note.viewCount,
        totalInteraction,
        interactionQuality: Number(note.interactionQuality) || 0,
        abnormalInteraction: note.abnormalInteraction || 0,
        isQualityInteraction: note.isQualityInteraction,
        flowLevel: note.flowLevel,
        isHot: note.isHot,
        lastInteractionCheckTime: note.lastInteractionCheckTime
      },
      checkResult,
      abnormalLogs
    }
  },

  async getAbnormalLogs(params: {
    page: number
    pageSize: number
    noteId?: number
    abnormalType?: string
    status?: number
    severity?: number
    sourceType?: string
  }): Promise<{ list: InteractionAbnormalLog[]; total: number }> {
    const { page, pageSize, noteId, abnormalType, status, severity, sourceType } = params
    const where: any = {}
    if (noteId) where.noteId = noteId
    if (abnormalType) where.abnormalType = abnormalType
    if (status !== undefined) where.status = status
    if (severity) where.severity = severity
    if (sourceType) where.sourceType = sourceType

    const { count, rows } = await InteractionAbnormalLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })
    return { list: rows, total: count }
  },

  async calibrateInteraction(
    noteId: number,
    operatorId: number,
    operatorName: string,
    operatorRole: string,
    reason?: string
  ): Promise<{ success: boolean; cleanedCount: number; noteData: any }> {
    const t = await sequelize.transaction()
    try {
      const note = await Note.findByPk(noteId, { transaction: t })
      if (!note) throw new AppError('笔记不存在', 404)

      const beforeData = {
        likeCount: note.likeCount,
        favoriteCount: note.favoriteCount,
        shareCount: note.shareCount,
        commentCount: note.commentCount,
        abnormalInteraction: note.abnormalInteraction,
        interactionQuality: note.interactionQuality,
        flowLevel: note.flowLevel
      }

      const pendingAbnormals = await InteractionAbnormalLog.findAll({
        where: { noteId, status: InteractionAbnormalStatus.PENDING },
        transaction: t
      })

      let totalCleaned = 0
      for (const abnormal of pendingAbnormals) {
        totalCleaned += abnormal.abnormalCount
        await abnormal.update({
          status: InteractionAbnormalStatus.CALIBRATED,
          handlerId: operatorId,
          handlerName: operatorName,
          handleNote: reason || '人工校准',
          handleTime: new Date()
        }, { transaction: t })
      }

      const baseQuality = Number(note.interactionQuality) || 0
      const qualityBonus = totalCleaned > 0 ? 15 : 0
      const qualityScore = Math.min(100, baseQuality + qualityBonus)
      const newAbnormalCount = Math.max(0, (note.abnormalInteraction || 0) - totalCleaned)

      let newFlowLevel = note.flowLevel
      if (qualityScore >= 80 && note.flowLevel < FlowLevel.PREMIUM) {
        newFlowLevel = FlowLevel.PREMIUM
      }

      await note.update({
        abnormalInteraction: newAbnormalCount,
        interactionQuality: qualityScore,
        flowLevel: newFlowLevel,
        lastInteractionCheckTime: new Date(),
        lastOpsTime: new Date(),
        lastOpsUserId: operatorId,
        lastOpsUserName: operatorName
      }, { transaction: t })

      await InteractionAuditLog.create({
        noteId,
        noteTitle: note.title,
        action: InteractionAuditAction.CALIBRATE,
        actionName: INTERACTION_AUDIT_ACTION_NAMES[InteractionAuditAction.CALIBRATE],
        operatorId,
        operatorName,
        operatorRole,
        beforeData: JSON.stringify(beforeData),
        afterData: JSON.stringify({
          likeCount: note.likeCount,
          favoriteCount: note.favoriteCount,
          shareCount: note.shareCount,
          commentCount: note.commentCount,
          abnormalInteraction: newAbnormalCount,
          interactionQuality: qualityScore,
          flowLevel: newFlowLevel
        }),
        abnormalIds: pendingAbnormals.map(a => a.id).join(','),
        handledCount: pendingAbnormals.length,
        successCount: pendingAbnormals.length,
        reason: reason || '校准互动数据
      }, { transaction: t })

      await t.commit()

      return {
        success: true,
        cleanedCount: totalCleaned,
        noteData: {
          id: note.id,
          abnormalInteraction: newAbnormalCount,
          interactionQuality: qualityScore,
          flowLevel: newFlowLevel
        }
      }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async cleanInteraction(
    noteId: number,
    operatorId: number,
    operatorName: string,
    operatorRole: string,
    reason?: string
  ): Promise<{ success: boolean; cleanedCount: number }> {
    const t = await sequelize.transaction()
    try {
      const note = await Note.findByPk(noteId, { transaction: t })
      if (!note) throw new AppError('笔记不存在', 404)

      const beforeData = {
        likeCount: note.likeCount,
        favoriteCount: note.favoriteCount,
        shareCount: note.shareCount,
        commentCount: note.commentCount,
        abnormalInteraction: note.abnormalInteraction,
        interactionQuality: note.interactionQuality,
        flowLevel: note.flowLevel
      }

      const pendingAbnormals = await InteractionAbnormalLog.findAll({
        where: { noteId, status: { [Op.in]: [InteractionAbnormalStatus.PENDING, InteractionAbnormalStatus.REVIEW] } },
        transaction: t
      })

      let totalCleaned = 0
      for (const abnormal of pendingAbnormals) {
        totalCleaned += abnormal.abnormalCount
        await abnormal.update({
          status: InteractionAbnormalStatus.CLEANED,
          handlerId: operatorId,
          handlerName: operatorName,
          handleNote: reason || '清理虚假数据',
          handleTime: new Date()
        }, { transaction: t })
      }

      const deduction = Math.min(totalCleaned, note.likeCount + note.favoriteCount + note.shareCount)
      const likeDeduction = Math.min(Math.floor(totalCleaned * 0.5), note.likeCount)
      const favDeduction = Math.min(Math.floor(totalCleaned * 0.3), note.favoriteCount)
      const shareDeduction = Math.min(Math.floor(totalCleaned * 0.2), note.shareCount)

      const newAbnormalCount = Math.max(0, (note.abnormalInteraction || 0) - totalCleaned)
      const qualityScore = Math.max(0, Math.min(100, (note.interactionQuality || 0) - (totalCleaned > 50 ? 20 : 10))

      let newFlowLevel = note.flowLevel
      if (qualityScore < 40 && note.flowLevel > FlowLevel.NORMAL) {
        newFlowLevel = FlowLevel.NORMAL
      }

      await note.update({
        likeCount: Math.max(0, note.likeCount - likeDeduction),
        favoriteCount: Math.max(0, note.favoriteCount - favDeduction),
        shareCount: Math.max(0, note.shareCount - shareDeduction),
        abnormalInteraction: newAbnormalCount,
        interactionQuality: qualityScore,
        flowLevel: newFlowLevel,
        lastInteractionCheckTime: new Date(),
        lastOpsTime: new Date(),
        lastOpsUserId: operatorId,
        lastOpsUserName: operatorName
      }, { transaction: t })

      const creator = await Creator.findOne({ where: { id: note.authorId } }, { transaction: t })
      if (creator && (creator as any).accountWeight !== undefined) {
        const weightDelta = totalCleaned > 100 ? -5 : -2
        const newWeight = Math.max(0, Math.min(100, (creator as any).accountWeight + weightDelta))
        await creator.update({ accountWeight: newWeight }, { transaction: t })
      }

      await InteractionAuditLog.create({
        noteId,
        noteTitle: note.title,
        action: InteractionAuditAction.CLEAN,
        actionName: INTERACTION_AUDIT_ACTION_NAMES[InteractionAuditAction.CLEAN],
        operatorId,
        operatorName,
        operatorRole,
        beforeData: JSON.stringify(beforeData),
        afterData: JSON.stringify({
          likeCount: Math.max(0, note.likeCount - likeDeduction),
          favoriteCount: Math.max(0, note.favoriteCount - favDeduction),
          shareCount: Math.max(0, note.shareCount - shareDeduction),
          abnormalInteraction: newAbnormalCount,
          interactionQuality: qualityScore,
          flowLevel: newFlowLevel
        }),
        abnormalIds: pendingAbnormals.map(a => a.id).join(','),
        handledCount: pendingAbnormals.length,
        successCount: pendingAbnormals.length,
        reason: reason || '清理虚假互动数据'
      }, { transaction: t })

      await t.commit()
      return { success: true, cleanedCount: totalCleaned }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async markQuality(
    noteId: number,
    isQuality: number,
    operatorId: number,
    operatorName: string,
    operatorRole: string,
    reason?: string
  ): Promise<{ success: boolean }> {
    const t = await sequelize.transaction()
    try {
      const note = await Note.findByPk(noteId, { transaction: t })
      if (!note) throw new AppError('笔记不存在', 404)

      const beforeData = { isQualityInteraction: note.isQualityInteraction, flowLevel: note.flowLevel }
      let newFlowLevel = note.flowLevel

      if (isQuality === 1) {
        newFlowLevel = Math.max(note.flowLevel, FlowLevel.PREMIUM)
      }

      await note.update({
        isQualityInteraction: isQuality,
        flowLevel: newFlowLevel,
        lastOpsTime: new Date(),
        lastOpsUserId: operatorId,
        lastOpsUserName: operatorName
      }, { transaction: t })

      await InteractionAuditLog.create({
        noteId,
        noteTitle: note.title,
        action: InteractionAuditAction.MARK_QUALITY,
        actionName: INTERACTION_AUDIT_ACTION_NAMES[InteractionAuditAction.MARK_QUALITY],
        operatorId,
        operatorName,
        operatorRole,
        beforeData: JSON.stringify(beforeData),
        afterData: JSON.stringify({ isQualityInteraction: isQuality, flowLevel: newFlowLevel }),
        handledCount: 1,
        successCount: 1,
        reason: reason || (isQuality === 1 ? '标记为优质互动笔记' : '取消优质互动标记')
      }, { transaction: t })

      await t.commit()
      return { success: true }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async batchCalibrate(
    noteIds: number[],
    operatorId: number,
    operatorName: string,
    operatorRole: string,
    reason?: string
  ): Promise<{ total: number; success: number; fail: number }> {
    let successCount = 0
    let failCount = 0
    const failedIds: number[] = []

    for (const noteId of noteIds) {
      try {
        await this.calibrateInteraction(noteId, operatorId, operatorName, operatorRole, reason)
        successCount++
      } catch {
        failCount++
        failedIds.push(noteId)
      }
    }

    await InteractionAuditLog.create({
      noteId: 0,
      noteTitle: '',
      action: InteractionAuditAction.BATCH_CALIBRATE,
      actionName: INTERACTION_AUDIT_ACTION_NAMES[InteractionAuditAction.BATCH_CALIBRATE],
      operatorId,
      operatorName,
      operatorRole,
      beforeData: JSON.stringify({ noteIds, count: noteIds.length }),
      afterData: JSON.stringify({ success: successCount, fail: failCount, failedIds }),
      handledCount: noteIds.length,
      successCount,
      reason: reason || '批量校准互动数据'
    })

    return { total: noteIds.length, success: successCount, fail: failCount }
  },

  async batchClean(
    noteIds: number[],
    operatorId: number,
    operatorName: string,
    operatorRole: string,
    reason?: string
  ): Promise<{ total: number; success: number; fail: number }> {
    let successCount = 0
    let failCount = 0
    const failedIds: number[] = []

    for (const noteId of noteIds) {
      try {
        await this.cleanInteraction(noteId, operatorId, operatorName, operatorRole, reason)
        successCount++
      } catch {
        failCount++
        failedIds.push(noteId)
      }
    }

    await InteractionAuditLog.create({
      noteId: 0,
      noteTitle: '',
      action: InteractionAuditAction.BATCH_CLEAN,
      actionName: INTERACTION_AUDIT_ACTION_NAMES[InteractionAuditAction.BATCH_CLEAN],
      operatorId,
      operatorName,
      operatorRole,
      beforeData: JSON.stringify({ noteIds, count: noteIds.length }),
      afterData: JSON.stringify({ success: successCount, fail: failCount, failedIds }),
      handledCount: noteIds.length,
      successCount,
      reason: reason || '批量清理虚假互动数据'
    })

    return { total: noteIds.length, success: successCount, fail: failCount }
  },

  async batchMarkQuality(
    noteIds: number[],
    isQuality: number,
    operatorId: number,
    operatorName: string,
    operatorRole: string,
    reason?: string
  ): Promise<{ total: number; success: number; fail: number }> {
    let successCount = 0
    let failCount = 0
    const failedIds: number[] = []

    for (const noteId of noteIds) {
      try {
        await this.markQuality(noteId, isQuality, operatorId, operatorName, operatorRole, reason)
        successCount++
      } catch {
        failCount++
        failedIds.push(noteId)
      }
    }

    await InteractionAuditLog.create({
      noteId: 0,
      noteTitle: '',
      action: InteractionAuditAction.BATCH_MARK_QUALITY,
      actionName: INTERACTION_AUDIT_ACTION_NAMES[InteractionAuditAction.BATCH_MARK_QUALITY],
      operatorId,
      operatorName,
      operatorRole,
      beforeData: JSON.stringify({ noteIds, count: noteIds.length, isQuality }),
      afterData: JSON.stringify({ success: successCount, fail: failCount, failedIds }),
      handledCount: noteIds.length,
      successCount,
      reason: reason || '批量标记优质互动笔记'
    })

    return { total: noteIds.length, success: successCount, fail: failCount }
  },

  async getTrace(noteId: number): Promise<InteractionTraceResult> {
    const note = await Note.findByPk(noteId)
    if (!note) throw new AppError('笔记不存在', 404)

    const checkResult = await interactionComplianceService.fullCheck(noteId)
    const abnormalRecords = await InteractionAbnormalLog.findAll({
      where: { noteId },
      order: [['create_time', 'DESC']],
      limit: 100
    })

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const behaviorLogs = await BehaviorLog.findAll({
      where: { targetId: noteId, targetType: 'note', createTime: { [Op.gte]: oneDayAgo },
      attributes: ['userId', 'userName', 'behaviorType', 'ip', 'createTime']
    })

    const byType: Record<string, number> = {}
    for (const log of behaviorLogs) {
      byType[log.behaviorType] = (byType[log.behaviorType] || 0) + 1
    }

    const hourMap = new Map<string, number>()
    for (const log of behaviorLogs) {
      const hour = new Date(log.createTime).getHours().toString().padStart(2, '0') + ':00'
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    }
    const byHour = Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, count }))

    const ipMap = new Map<string, number>()
    for (const log of behaviorLogs) {
      if (log.ip) ipMap.set(log.ip, (ipMap.get(log.ip) || 0) + 1)
    }
    const byIp = Array.from(ipMap.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const userMap = new Map<number, { name: string; count: number }>()
    for (const log of behaviorLogs) {
      const existing = userMap.get(log.userId) || { name: log.userName, count: 0 }
      existing.count++
      userMap.set(log.userId, existing)
    }
    const byUser = Array.from(userMap.entries())
      .map(([userId, info]) => ({ userId, userName: info.name, count: info.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    const auditLogs = await InteractionAuditLog.findAll({
      where: { noteId },
      order: [['create_time', 'DESC']],
      limit: 50
    })

    const creatorInfo = await interactionComplianceService.checkCreatorQuality(note.authorId)

    const realUserCount = userMap.size
    const totalCount = behaviorLogs.length
    const realUserRatio = totalCount > 0 ? Math.round(realUserCount / totalCount * 100) / 100 : 1
    const abnormalCount = abnormalRecords.reduce((sum, r) => sum + r.abnormalCount, 0)
    const abnormalRatio = totalCount > 0 ? Math.round(abnormalCount / totalCount * 100) / 100 : 0

    const totalInteraction = note.likeCount + note.favoriteCount + note.shareCount + note.commentCount

    return {
      note: {
        id: note.id,
        title: note.title,
        coverImage: note.coverImage,
        authorId: note.authorId,
        authorName: note.authorName,
        status: note.status,
        likeCount: note.likeCount,
        favoriteCount: note.favoriteCount,
        shareCount: note.shareCount,
        commentCount: note.commentCount,
        viewCount: note.viewCount,
        totalInteraction,
        interactionQuality: Number(note.interactionQuality) || 0,
        abnormalInteraction: note.abnormalInteraction || 0,
        isQualityInteraction: note.isQualityInteraction,
        riskLevel: checkResult.riskLevel,
        abnormalTypes: checkResult.abnormalTypes.join(','),
        flowLevel: note.flowLevel,
        isHot: note.isHot,
        lastInteractionCheckTime: note.lastInteractionCheckTime,
        lastOpsTime: note.lastOpsTime,
        createTime: note.createTime,
        updateTime: note.updateTime
      },
      abnormalRecords,
      behaviorStats: {
        total: totalCount,
        byType,
        byHour,
        byIp,
        byUser
      },
      qualityAnalysis: {
        qualityScore: checkResult.qualityScore,
        riskLevel: checkResult.riskLevel,
        realUserRatio,
        abnormalRatio,
        suggestions: checkResult.suggestions
      },
      auditLogs,
      creatorInfo
    }
  },

  async getReport(params: {
    page: number
    pageSize: number
    keyword?: string
    minAbnormalMin?: number
    riskLevel?: number
    startTime?: string
    endTime?: string
  }): Promise<{ list: InteractionReportItem[]; total: number; summary: any }> {
    const { page, pageSize, keyword, abnormalMin, riskLevel, startTime, endTime } = params

    const noteWhere: any = { status: 2 }
    if (keyword) noteWhere.title = { [Op.like]: `%${keyword}%` }
    if (startTime) noteWhere.createTime = { [Op.gte]: new Date(startTime) }
    if (endTime) noteWhere.createTime = { ...(noteWhere.createTime || {}), [Op.lte]: new Date(endTime) }

    const { count, rows } = await Note.findAndCountAll({
      where: noteWhere,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    const reportList: InteractionReportItem[] = []
    let totalAbnormal = 0
    let totalReal = 0
    let highRiskCount = 0

    for (const note of rows) {
      const abnormals = await InteractionAbnormalLog.findAll({
        where: { noteId: note.id }
      })

      const abnormalCount = abnormals.reduce((sum, a) => sum + a.abnormalCount, 0)
      const totalInteraction = note.likeCount + note.favoriteCount + note.shareCount + note.commentCount
      const maxRisk = abnormals.length > 0 ? Math.max(...abnormals.map(a => a.riskLevel)) : 0
      const abnormalTypes = [...new Set(abnormals.map(a => a.abnormalType))

      if (abnormalMin !== undefined && abnormalCount < abnormalMin) continue
      if (riskLevel !== undefined && maxRisk !== riskLevel) continue
      if (maxRisk >= 2) highRiskCount++

      totalAbnormal += abnormalCount
      totalReal += Math.max(0, totalInteraction - abnormalCount)

      const qualityScore = await interactionComplianceService.fullCheck(note.id).then(r => r.qualityScore).catch(() => 0)

      reportList.push({
        noteId: note.id,
        noteTitle: note.title,
        authorId: note.authorId,
        authorName: note.authorName,
        totalInteraction,
        abnormalCount,
        realInteraction: Math.max(0, totalInteraction - abnormalCount),
        qualityScore: 0,
        riskLevel: maxRisk,
        abnormalTypes,
        flowLevel: note.flowLevel,
        growthTrend: note.interactionQuality && Number(note.interactionQuality) >= 60 ? '上升' : '下降',
        createTime: note.createTime.toISOString()
      })
    }

    const summary = {
      totalNotes: count,
      totalInteraction: totalReal + totalAbnormal,
      totalAbnormal,
      totalReal,
      highRiskCount,
      abnormalRate: count > 0 ? Math.round(highRiskCount / count * 100) / 100 : 0
    }

    return { list: reportList, total: count, summary }
  },

  async getStats(): Promise<any> {
    const totalNotes = await Note.count({ where: { status: 2 } })
    const totalInteractions = await Note.sum('like_count + favorite_count + share_count + comment_count', { where: { status: 2 } }) || 0

    const pendingAbnormals = await InteractionAbnormalLog.count({ where: { status: InteractionAbnormalStatus.PENDING })
    const todayAbnormals = await InteractionAbnormalLog.count({
      where: {
      createTime: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } }
    })
    const qualityNotes = await Note.count({ where: { is_quality_interaction: 1, status: 2 } })
    const highRiskNotes = await InteractionAbnormalLog.count({
      where: { riskLevel: 3, status: InteractionAbnormalStatus.PENDING },
      distinct: true,
      col: 'note_id'
    })

    const today = new Date()
    const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const todayInteractions = await BehaviorLog.count({
      where: { targetType: 'note', createTime: { [Op.gte]: oneDayAgo } }
    })

    const todayCalibrated = await InteractionAuditLog.count({
      where: { action: { [Op.in]: [InteractionAuditAction.CALIBRATE, InteractionAuditAction.BATCH_CALIBRATE] },
        createTime: { [Op.gte]: new Date(today.setHours(0, 0, 0, 0)) }
    })

    return {
      totalNotes,
      totalInteractions,
      pendingAbnormals,
      todayAbnormals,
      qualityNotes,
      highRiskNotes,
      todayInteractions,
      todayCalibrated,
      abnormalRate: totalNotes > 0 ? Math.round(pendingAbnormals / totalNotes * 100) / 100 : 0
    }
  },

  async getAuditLogs(params: {
    page: number
    pageSize: number
    noteId?: number
    action?: string
    operatorId?: number
  }): Promise<{ list: InteractionAuditLog[]; total: number }> {
    const { page, pageSize, noteId, action, operatorId } = params
    const where: any = {}
    if (noteId) where.noteId = noteId
    if (action) where.action = action
    if (operatorId) where.operatorId = operatorId

    const { count, rows } = await InteractionAuditLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })
    return { list: rows, total: count }
  },

  async runAutoCheck(noteId: number): Promise<any> {
    const note = await Note.findByPk(noteId)
    if (!note) throw new AppError('笔记不存在', 404)

    const checkResult = await interactionComplianceService.fullCheck(noteId)

    if (checkResult.isAbnormal) {
      for (const detail of checkResult.abnormalDetails) {
        await InteractionAbnormalLog.create({
          noteId,
          noteTitle: note.title,
          interactionType: 'all',
          abnormalType: detail.type,
          abnormalReason: detail.reason,
          severity: detail.severity,
          abnormalCount: detail.abnormalCount,
          sourceType: 'auto',
          status: InteractionAbnormalStatus.PENDING,
          riskLevel: detail.severity,
          relatedUserIds: detail.relatedUserIds?.join(','),
          relatedIp: detail.relatedIps?.[0] || '',
          impactValue: detail.abnormalCount * 2
        })
      }
    }

    await note.update({
      interactionQuality: checkResult.qualityScore,
      abnormalInteraction: checkResult.totalAbnormalCount,
      lastInteractionCheckTime: new Date()
    })

    return {
      isAbnormal: checkResult.isAbnormal,
      abnormalCount: checkResult.abnormalDetails.length,
      qualityScore: checkResult.qualityScore,
      riskLevel: checkResult.riskLevel
    }
  }
}

export default interactionService
