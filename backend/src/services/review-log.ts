import { ReviewLog, ReviewAbnormalLog } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import { ReviewAction } from '@/enums/review'
import type { ReviewerStats } from '@/types/index'

export const reviewLogService = {
  async list(params: {
    page: number
    pageSize: number
    noteId?: number
    reviewerId?: number
    action?: number
    startTime?: string
    endTime?: string
  }) {
    const { page, pageSize, noteId, reviewerId, action, startTime, endTime } = params
    const where: any = {}

    if (noteId !== undefined) where.noteId = noteId
    if (reviewerId !== undefined) where.reviewerId = reviewerId
    if (action !== undefined) where.action = action
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: startTime }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: endTime }

    const { count, rows } = await ReviewLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const log = await ReviewLog.findByPk(id)
    if (!log) throw new AppError('审核日志不存在', 404)
    return log
  },

  async create(data: {
    noteId: number
    noteTitle: string
    reviewerId: number
    reviewerName: string
    action: number
    reviewLevel: number
    statusBefore: number
    statusAfter: number
    reason?: string
    violationType?: string
    reviewWeight?: number
    isAbnormal?: number
    abnormalReason?: string
  }) {
    const log = await ReviewLog.create({
      ...data,
      reviewWeight: data.reviewWeight || 0,
      isAbnormal: data.isAbnormal || 0,
      abnormalReason: data.abnormalReason || ''
    } as any)
    return { id: log.id }
  },

  async getNoteReviewHistory(noteId: number) {
    const logs = await ReviewLog.findAll({
      where: { noteId },
      order: [['create_time', 'ASC']]
    })
    return logs
  },

  async getReviewerStats(reviewerId: number, days: number = 7): Promise<ReviewerStats> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const where: any = {
      reviewerId,
      createTime: { [Op.gte]: startDate }
    }

    const totalReviewed = await ReviewLog.count({ where })
    const approved = await ReviewLog.count({ where: { ...where, action: ReviewAction.APPROVE } })
    const rejected = await ReviewLog.count({ where: { ...where, action: ReviewAction.REJECT } })
    const postponed = await ReviewLog.count({ where: { ...where, action: ReviewAction.POSTPONE } })
    const abnormalCount = await ReviewAbnormalLog.count({
      where: {
        reviewerId,
        createTime: { [Op.gte]: startDate }
      }
    })

    const rejectionRate = totalReviewed > 0 ? rejected / totalReviewed : 0

    return {
      totalReviewed,
      approved,
      rejected,
      postponed,
      rejectionRate,
      abnormalCount
    }
  },

  async remove(id: number) {
    const log = await ReviewLog.findByPk(id)
    if (!log) throw new AppError('审核日志不存在', 404)
    await log.destroy()
    return true
  }
}
