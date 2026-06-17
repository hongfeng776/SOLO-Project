import { Note, User } from '@models/index'
import { AppError } from '@utils/response'
import { delCacheByPrefix } from '@utils/cache'
import { CacheKey } from '@/enums/cache'
import { ReviewAction, REVIEW_ACTION_NAMES } from '@/enums/review'
import { NoteStatus, ReviewerLevel } from '@/enums/business'
import type { ReviewActionData, BatchReviewData, ReviewResult } from '@/types/index'
import { reviewComplianceService } from './review-compliance'
import { reviewLogService } from './review-log'
import { notificationService } from './notification'

export const reviewService = {
  async executeReview(
    reviewerId: number,
    reviewerName: string,
    data: ReviewActionData
  ): Promise<ReviewResult> {
    const { noteId, action, reason, violationType } = data

    const note = await Note.findByPk(noteId)
    if (!note) {
      return { noteId, success: false, action, statusAfter: 0, error: '笔记不存在' }
    }

    if (note.status !== NoteStatus.PENDING_REVIEW) {
      return { noteId, success: false, action, statusAfter: note.status, error: '笔记状态不是待审核' }
    }

    try {
      this.validateReviewAction(data)
    } catch (error: any) {
      return { noteId, success: false, action, statusAfter: note.status, error: error.message }
    }

    const complianceResult = await reviewComplianceService.validateReview(reviewerId, data)
    if (!complianceResult.isCompliant) {
      return { noteId, success: false, action, statusAfter: note.status, error: complianceResult.abnormalReason || '审核不合规' }
    }

    const statusBefore = note.status
    let statusAfter = note.status
    const updateData: any = {
      lastReviewerId: reviewerId,
      lastReviewerName: reviewerName,
      lastReviewTime: new Date()
    }

    switch (action) {
      case ReviewAction.APPROVE:
        statusAfter = NoteStatus.PUBLISHED
        updateData.status = NoteStatus.PUBLISHED
        updateData.flowUnlocked = 1
        updateData.publishTime = new Date()
        break

      case ReviewAction.REJECT:
        statusAfter = NoteStatus.REJECTED
        updateData.status = NoteStatus.REJECTED
        updateData.flowUnlocked = 0
        updateData.rejectReason = reason
        updateData.violationType = violationType
        break

      case ReviewAction.POSTPONE:
        statusAfter = NoteStatus.POSTPONED
        updateData.status = NoteStatus.POSTPONED
        updateData.flowUnlocked = 0
        updateData.postponeReason = reason
        break

      default:
        return { noteId, success: false, action, statusAfter: note.status, error: '无效的审核动作' }
    }

    await note.update(updateData)

    const reviewLogIdResult = await reviewLogService.create({
      noteId,
      noteTitle: note.title,
      reviewerId,
      reviewerName,
      action,
      reviewLevel: note.reviewLevel,
      statusBefore,
      statusAfter,
      reason,
      violationType,
      reviewWeight: note.reviewWeight,
      isAbnormal: complianceResult.isAbnormal ? 1 : 0,
      abnormalReason: complianceResult.abnormalReason
    })

    if (complianceResult.isAbnormal && complianceResult.abnormalType && complianceResult.abnormalReason) {
      await reviewComplianceService.recordAbnormalReview(
        reviewLogIdResult.id,
        complianceResult.abnormalType,
        complianceResult.abnormalReason,
        complianceResult.severity || 1
      )
    }

    const actionName = REVIEW_ACTION_NAMES[action] || '审核'
    let notificationContent = ''
    switch (action) {
      case ReviewAction.APPROVE:
        notificationContent = `您的笔记「${note.title}」已通过审核，已解锁流量分发权限`
        break
      case ReviewAction.REJECT:
        notificationContent = `您的笔记「${note.title}」审核未通过：${reason}`
        break
      case ReviewAction.POSTPONE:
        notificationContent = `您的笔记「${note.title}」已被暂缓审核：${reason}`
        break
    }

    await notificationService.create({
      userId: note.authorId,
      type: 'review',
      title: `笔记${actionName}通知`,
      content: notificationContent,
      relatedId: noteId,
      relatedType: 'note'
    })

    delCacheByPrefix(`${CacheKey.NOTE_DETAIL}${noteId}`).catch(() => {})
    delCacheByPrefix(CacheKey.NOTE_HOT_LIST).catch(() => {})

    await User.increment('reviewCount', { by: 1, where: { id: reviewerId } })

    return {
      noteId,
      success: true,
      action,
      statusAfter
    }
  },

  validateReviewAction(data: ReviewActionData): void {
    const { action, reason, violationType } = data

    if (action === ReviewAction.REJECT) {
      if (!violationType) {
        throw new AppError('驳回操作必须指定违规类型', 400)
      }
      if (!reason || reason.length < 10) {
        throw new AppError('驳回原因不能少于10个字符', 400)
      }
    }

    if (action === ReviewAction.POSTPONE) {
      if (!reason || reason.trim() === '') {
        throw new AppError('暂缓审核必须提供原因', 400)
      }
    }
  },

  async batchReview(
    reviewerId: number,
    reviewerName: string,
    reviewerLevel: number,
    data: BatchReviewData
  ): Promise<{ total: number; success: number; fail: number; results: ReviewResult[] }> {
    const { noteIds, action, reason, violationType } = data

    if (action === ReviewAction.REJECT && reviewerLevel < ReviewerLevel.SENIOR) {
      throw new AppError('您没有批量驳回权限', 403)
    }

    if (reviewerLevel === ReviewerLevel.NORMAL && action !== ReviewAction.APPROVE) {
      throw new AppError('普通审核员批量操作仅支持通过', 403)
    }

    const results: ReviewResult[] = []
    let success = 0
    let fail = 0

    for (const noteId of noteIds) {
      try {
        const note = await Note.findByPk(noteId)
        if (!note || note.status !== NoteStatus.PENDING_REVIEW) {
          results.push({
            noteId,
            success: false,
            action,
            statusAfter: note?.status || 0,
            error: note ? '笔记状态不是待审核' : '笔记不存在'
          })
          fail++
          continue
        }

        const result = await this.executeReview(reviewerId, reviewerName, {
          noteId,
          action,
          reason,
          violationType
        })

        results.push(result)
        if (result.success) {
          success++
        } else {
          fail++
        }
      } catch (error: any) {
        results.push({
          noteId,
          success: false,
          action,
          statusAfter: 0,
          error: error.message || '审核失败'
        })
        fail++
      }
    }

    return {
      total: noteIds.length,
      success,
      fail,
      results
    }
  },

  async performDoubleClickReview(
    reviewerId: number,
    reviewerName: string,
    noteId: number
  ): Promise<ReviewResult> {
    return await this.executeReview(reviewerId, reviewerName, {
      noteId,
      action: ReviewAction.APPROVE
    })
  }
}
