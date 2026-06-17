import { Note, ReviewAbnormalLog, ReviewLog } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import { ReviewAction, ReviewAbnormalType, ReviewAbnormalSeverity } from '@/enums/review'
import type { ReviewActionData, ReviewComplianceResult } from '@/types/index'
import { noteComplianceService } from './note-compliance'

export const reviewComplianceService = {
  async validateReview(reviewerId: number, data: ReviewActionData): Promise<ReviewComplianceResult> {
    const { action, noteId, violationType, reason } = data

    if (action === ReviewAction.REJECT) {
      if (!violationType) {
        return {
          isCompliant: false,
          isAbnormal: true,
          abnormalType: ReviewAbnormalType.NO_REASON_REJECT,
          abnormalReason: '驳回操作必须指定违规类型',
          severity: ReviewAbnormalSeverity.HIGH
        }
      }

      if (!reason || reason.length < 10) {
        return {
          isCompliant: false,
          isAbnormal: true,
          abnormalType: ReviewAbnormalType.NO_REASON_REJECT,
          abnormalReason: '驳回原因不能少于10个字符',
          severity: ReviewAbnormalSeverity.MEDIUM
        }
      }

      const typeMatchResult = await this.checkViolationTypeMatch(noteId, violationType)
      if (!typeMatchResult.match) {
        return {
          isCompliant: false,
          isAbnormal: true,
          abnormalType: ReviewAbnormalType.VIOLATION_TYPE_MISMATCH,
          abnormalReason: `违规类型不匹配，实际违规：${typeMatchResult.actualViolations.join(', ') || '无'}`,
          severity: ReviewAbnormalSeverity.MEDIUM
        }
      }
    }

    const rejectionCheck = await this.checkExcessiveRejection(reviewerId)
    if (rejectionCheck.isAbnormal && action === ReviewAction.REJECT) {
      return {
        isCompliant: true,
        isAbnormal: true,
        abnormalType: ReviewAbnormalType.EXCESSIVE_REJECTION,
        abnormalReason: `近24小时驳回率过高：${(rejectionCheck.rate * 100).toFixed(1)}%`,
        severity: ReviewAbnormalSeverity.HIGH
      }
    }

    return {
      isCompliant: true,
      isAbnormal: false
    }
  },

  async checkExcessiveRejection(reviewerId: number): Promise<{ rate: number; isAbnormal: boolean }> {
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const totalReviewed = await ReviewLog.count({
      where: {
        reviewerId,
        createTime: { [Op.gte]: twentyFourHoursAgo }
      }
    })

    if (totalReviewed < 10) {
      return { rate: 0, isAbnormal: false }
    }

    const rejectedCount = await ReviewLog.count({
      where: {
        reviewerId,
        action: ReviewAction.REJECT,
        createTime: { [Op.gte]: twentyFourHoursAgo }
      }
    })

    const rate = totalReviewed > 0 ? rejectedCount / totalReviewed : 0
    const isAbnormal = rate > 0.7

    return { rate, isAbnormal }
  },

  async checkViolationTypeMatch(noteId: number, violationType: string): Promise<{ match: boolean; actualViolations: string[] }> {
    const note = await Note.findByPk(noteId)
    if (!note) throw new AppError('笔记不存在', 404)

    const complianceResult = await noteComplianceService.checkContentCompliance({
      title: note.title,
      content: note.content,
      coverImage: note.coverImage,
      videoUrl: note.videoUrl,
      noteType: note.noteType
    })

    const actualViolations = complianceResult.violations.map(v => v.type)

    const violationTypeMap: Record<string, string[]> = {
      'sensitive_word': ['敏感词', '敏感内容', '色情', '暴力', '政治敏感'],
      'word_count': ['字数不足', '字数过多', '内容过短', '内容过长'],
      'material': ['封面缺失', '视频缺失', '素材问题'],
      'external_link': ['违规链接', '外部链接', '非法链接'],
      'tag_count': ['标签过多', '标签问题']
    }

    let match = false
    for (const [type, keywords] of Object.entries(violationTypeMap)) {
      if (actualViolations.includes(type) && keywords.some(k => violationType.includes(k))) {
        match = true
        break
      }
    }

    if (actualViolations.length === 0 && violationType.includes('其他')) {
      match = true
    }

    return { match, actualViolations }
  },

  async recordAbnormalReview(
    reviewLogId: number,
    abnormalType: string,
    abnormalReason: string,
    severity: number
  ): Promise<number> {
    const reviewLog = await ReviewLog.findByPk(reviewLogId)
    if (!reviewLog) throw new AppError('审核日志不存在', 404)

    const abnormalLog = await ReviewAbnormalLog.create({
      reviewLogId,
      noteId: reviewLog.noteId,
      reviewerId: reviewLog.reviewerId,
      reviewerName: reviewLog.reviewerName,
      abnormalType,
      abnormalReason,
      severity,
      status: 0
    } as any)

    return abnormalLog.id
  },

  async getAbnormalLogs(params: {
    page: number
    pageSize: number
    reviewerId?: number
    handled?: number
  }) {
    const { page, pageSize, reviewerId, handled } = params
    const where: any = {}

    if (reviewerId !== undefined) where.reviewerId = reviewerId
    if (handled !== undefined) where.status = handled

    const { count, rows } = await ReviewAbnormalLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async handleAbnormalLog(
    id: number,
    handlerId: number,
    handlerName: string,
    handleNote: string
  ): Promise<boolean> {
    const abnormalLog = await ReviewAbnormalLog.findByPk(id)
    if (!abnormalLog) throw new AppError('异常审核日志不存在', 404)

    await abnormalLog.update({
      status: 1,
      handlerId,
      handlerName,
      handleNote
    })

    return true
  }
}
