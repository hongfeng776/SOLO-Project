import { Note, Creator, NoteOpsLog, Activity } from '@models/index'
import { AppError } from '@utils/response'
import { delCacheByPrefix } from '@utils/cache'
import { CacheKey } from '@/enums/cache'
import { NoteStatus } from '@/enums/business'
import { OperatorRole, VALID_STATE_TRANSITIONS, FlowLevel } from '@/enums/note-ops'
import type { NoteOpsData, BatchNoteOpsData, NoteOpsResult, NoteOpsComplianceResult } from '@/types/index'
import { Op } from 'sequelize'

export const noteOpsService = {
  validateStateTransition(previousStatus: number, newStatus: number): NoteOpsComplianceResult {
    const allowedTransitions = VALID_STATE_TRANSITIONS[previousStatus]
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      const blockedStates = [0, 1, 3, 5, 6]
      if (blockedStates.includes(previousStatus)) {
        return {
          allowed: false,
          blockedReason: `笔记当前状态(${previousStatus})不支持运维操作，请通过审核系统处理`
        }
      }
      return {
        allowed: false,
        blockedReason: `无效的状态变更：无法从状态${previousStatus}变更为状态${newStatus}`
      }
    }
    return { allowed: true }
  },

  async validateBeforeOps(
    operatorRole: string,
    noteId: number,
    newStatus: number
  ): Promise<NoteOpsComplianceResult> {
    const warnings: string[] = []

    const note = await Note.findByPk(noteId)
    if (!note) {
      return { allowed: false, blockedReason: '笔记不存在' }
    }

    if (note.deleteTime) {
      return { allowed: false, blockedReason: '笔记已删除，无法进行运维操作' }
    }

    const transitionResult = this.validateStateTransition(note.status, newStatus)
    if (!transitionResult.allowed) {
      return transitionResult
    }

    if (
      (newStatus === NoteStatus.OFF_SHELF || newStatus === NoteStatus.FLOW_LIMITED) &&
      note.isHot === 1
    ) {
      return {
        allowed: false,
        blockedReason: '笔记处于热门流量推送中，请先移除热门推送再操作'
      }
    }

    const now = new Date()
    const activeActivity = await Activity.findOne({
      where: {
        status: 1,
        startTime: { [Op.lte]: now },
        endTime: { [Op.gte]: now }
      }
    })
    if (activeActivity) {
      warnings.push(`笔记关联活动「${activeActivity.name}」正在进行中，操作可能影响活动效果`)
    }

    if (operatorRole === OperatorRole.NORMAL_OPS && note.flowLevel >= FlowLevel.HOT) {
      return {
        allowed: false,
        blockedReason: '普通运维人员无权操作热门置顶内容，请联系高级运维或管理员'
      }
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentOps = await NoteOpsLog.count({
      where: {
        noteId,
        newStatus,
        createTime: { [Op.gte]: fiveMinutesAgo }
      }
    })

    let isAbnormal = false
    let abnormalReason = ''
    if (recentOps > 0) {
      isAbnormal = true
      abnormalReason = '5分钟内存在重复操作记录'
    }

    if (note.viewCount > 100000 && (newStatus === NoteStatus.OFF_SHELF || newStatus === NoteStatus.FLOW_LIMITED)) {
      warnings.push(`笔记浏览量超过10万(${note.viewCount})，下架/限流可能造成较大影响`)
    }

    return {
      allowed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      isAbnormal,
      abnormalReason: isAbnormal ? abnormalReason : undefined
    }
  },

  async executeOps(
    operatorId: number,
    operatorName: string,
    operatorRole: string,
    data: NoteOpsData
  ): Promise<NoteOpsResult> {
    const { noteId, newStatus, newFlowLevel, newFlowUnlocked, newIsHot, reason } = data

    const note = await Note.findByPk(noteId)
    if (!note) {
      throw new AppError('笔记不存在', 404)
    }

    const validationResult = await this.validateBeforeOps(operatorRole, noteId, newStatus)
    if (!validationResult.allowed) {
      throw new AppError(validationResult.blockedReason || '运维操作校验失败', 400)
    }

    const previousStatus = note.status
    const previousFlowLevel = note.flowLevel
    const previousFlowUnlocked = note.flowUnlocked
    const previousIsHot = note.isHot

    const updateData: any = {
      status: newStatus,
      lastOpsTime: new Date(),
      lastOpsUserId: operatorId,
      lastOpsUserName: operatorName
    }

    if (newFlowLevel !== undefined) {
      updateData.flowLevel = newFlowLevel
    }
    if (newFlowUnlocked !== undefined) {
      updateData.flowUnlocked = newFlowUnlocked
    }
    if (newIsHot !== undefined) {
      updateData.isHot = newIsHot
    }
    if (reason && (newStatus === NoteStatus.OFF_SHELF || newStatus === NoteStatus.FLOW_LIMITED)) {
      updateData.hiddenReason = reason
    }

    if (newStatus === NoteStatus.OFF_SHELF) {
      updateData.flowUnlocked = 0
      updateData.isHot = 0
    } else if (newStatus === NoteStatus.FLOW_LIMITED) {
      updateData.flowUnlocked = 0
      updateData.isHot = 0
      updateData.flowLevel = FlowLevel.NORMAL
    } else if (newStatus === NoteStatus.PUBLISHED) {
      if (previousStatus === NoteStatus.OFF_SHELF || previousStatus === NoteStatus.FLOW_LIMITED) {
        updateData.flowUnlocked = 1
      }
    }

    await note.update(updateData)

    const creator = await Creator.findOne({ where: { id: note.authorId } })
    if (creator) {
      let weightDelta = 0
      if (newStatus === NoteStatus.OFF_SHELF || newStatus === NoteStatus.FLOW_LIMITED) {
        weightDelta = -2
      } else if (newStatus === NoteStatus.PUBLISHED) {
        if (previousStatus === NoteStatus.OFF_SHELF || previousStatus === NoteStatus.FLOW_LIMITED) {
          weightDelta = 1
        }
      }
      if (weightDelta !== 0) {
        const newWeight = Math.max(0, Math.min(100, (creator.accountWeight || 50) + weightDelta))
        await creator.update({ accountWeight: newWeight })
      }
    }

    await NoteOpsLog.create({
      noteId,
      noteTitle: note.title,
      operatorId,
      operatorName,
      operatorRole,
      previousStatus,
      newStatus,
      previousFlowLevel,
      newFlowLevel: updateData.flowLevel ?? note.flowLevel,
      previousFlowUnlocked,
      newFlowUnlocked: updateData.flowUnlocked ?? note.flowUnlocked,
      previousIsHot,
      newIsHot: updateData.isHot ?? note.isHot,
      reason: reason || '',
      isAbnormal: validationResult.isAbnormal ? 1 : 0,
      abnormalReason: validationResult.abnormalReason || ''
    })

    delCacheByPrefix(`${CacheKey.NOTE_DETAIL}${noteId}`).catch(() => {})
    delCacheByPrefix(CacheKey.NOTE_HOT_LIST).catch(() => {})

    return {
      success: true,
      noteId,
      previousStatus,
      newStatus,
      message: validationResult.warnings?.join('; ')
    }
  },

  async batchOps(
    operatorId: number,
    operatorName: string,
    operatorRole: string,
    data: BatchNoteOpsData
  ): Promise<{ total: number; success: number; fail: number; results: NoteOpsResult[] }> {
    const { ids, newStatus, newFlowLevel, newFlowUnlocked, reason } = data
    const results: NoteOpsResult[] = []
    let successCount = 0
    let failCount = 0

    for (const noteId of ids) {
      try {
        const result = await this.executeOps(operatorId, operatorName, operatorRole, {
          noteId,
          newStatus,
          newFlowLevel,
          newFlowUnlocked,
          reason
        })
        results.push(result)
        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      } catch (error: any) {
        const note = await Note.findByPk(noteId)
        results.push({
          success: false,
          noteId,
          previousStatus: note?.status || 0,
          newStatus,
          message: error.message || '操作失败'
        })
        failCount++
      }
    }

    return {
      total: ids.length,
      success: successCount,
      fail: failCount,
      results
    }
  },

  async getNoteOpsHistory(
    noteId: number,
    params?: { page: number; pageSize: number }
  ) {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20

    const { count, rows } = await NoteOpsLog.findAndCountAll({
      where: { noteId },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async getAbnormalOpsList(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params

    const { count, rows } = await NoteOpsLog.findAndCountAll({
      where: { isAbnormal: 1 },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  }
}
