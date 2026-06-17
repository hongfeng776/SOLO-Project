import { Note } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import { NoteStatus } from '@/enums/business'
import { HIGH_RISK_WEIGHT_THRESHOLD } from '@/enums/review'

export const reviewQueueService = {
  async getReviewQueue(params: {
    page: number
    pageSize: number
    reviewLevel?: number
    noteType?: number
    keyword?: string
  }) {
    const { page, pageSize, reviewLevel, noteType, keyword } = params
    const where: any = {
      status: NoteStatus.PENDING_REVIEW
    }

    if (reviewLevel !== undefined) where.reviewLevel = reviewLevel
    if (noteType !== undefined) where.noteType = noteType
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { authorName: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const { count, rows } = await Note.findAndCountAll({
      where,
      attributes: [
        'id',
        'title',
        'coverImage',
        'noteType',
        'reviewLevel',
        'reviewWeight',
        'authorId',
        'authorName',
        'createTime'
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [
        ['reviewWeight', 'DESC'],
        ['createTime', 'ASC']
      ]
    })

    const list = rows.map((note: any) => ({
      ...note.toJSON(),
      isHighRisk: note.reviewWeight > HIGH_RISK_WEIGHT_THRESHOLD
    }))

    return { list, total: count, page, pageSize }
  },

  async getHighRiskCount(reviewLevel?: number): Promise<{ highRisk: number; total: number }> {
    const where: any = {
      status: NoteStatus.PENDING_REVIEW
    }

    if (reviewLevel !== undefined) {
      where.reviewLevel = reviewLevel
    }

    const total = await Note.count({ where })

    const highRisk = await Note.count({
      where: {
        ...where,
        reviewWeight: { [Op.gt]: HIGH_RISK_WEIGHT_THRESHOLD }
      }
    })

    return { highRisk, total }
  },

  async markAsReviewing(noteId: number, reviewerId: number): Promise<boolean> {
    const note = await Note.findByPk(noteId)
    if (!note) throw new AppError('笔记不存在', 404)
    if (note.status !== NoteStatus.PENDING_REVIEW) {
      throw new AppError('笔记状态不是待审核，无法标记为审核中', 400)
    }

    await note.update({
      lastReviewerId: reviewerId,
      lastReviewTime: new Date()
    })

    return true
  }
}
