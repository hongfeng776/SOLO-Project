import { Note, Tag } from '@models/index'
import { AppError } from '@utils/response'
import { getWithFallback, delCacheByPrefix } from '@utils/cache'
import { CacheKey, CacheTTL } from '@/enums/cache'
import { Op, fn, col, literal } from 'sequelize'
import { operationLogService } from './operation-log'

export const noteService = {
  async list(params: { page: number; pageSize: number; status?: number; keyword?: string; reviewLevel?: number }) {
    const { page, pageSize, status, keyword, reviewLevel } = params
    const where: any = {}

    if (status !== undefined) where.status = status
    if (reviewLevel !== undefined) where.reviewLevel = reviewLevel
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { authorName: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const { count, rows } = await Note.findAndCountAll({
      where,
      include: [{ model: Tag, as: 'tags', attributes: ['id', 'name', 'type'], through: { attributes: [] } }],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const cacheKey = `${CacheKey.NOTE_DETAIL}${id}`
    return getWithFallback(
      cacheKey,
      async () => {
        const note = await Note.findByPk(id, {
          include: [{ model: Tag, as: 'tags', attributes: ['id', 'name', 'type'], through: { attributes: [] } }]
        })
        if (!note) throw new AppError('笔记不存在', 404)
        return note
      },
      CacheTTL.SHORT
    )
  },

  async create(data: { title: string; content: string; coverImage?: string; authorId: number; authorName: string; tagIds?: number[] }) {
    const note = await Note.create({ ...data, status: 0 } as any)
    if (data.tagIds?.length) {
      const tags = await Tag.findAll({ where: { id: data.tagIds } })
      await (note as any).addTags(tags)
    }
    return { id: note.id }
  },

  async update(id: number, data: Partial<{ title: string; content: string; coverImage: string; tagIds: number[] }>) {
    const note = await Note.findByPk(id)
    if (!note) throw new AppError('笔记不存在', 404)
    await note.update(data)
    if (data.tagIds) {
      const tags = await Tag.findAll({ where: { id: data.tagIds } })
      await (note as any).setTags(tags)
    }
    delCacheByPrefix(`${CacheKey.NOTE_DETAIL}${id}`).catch(() => {})
    delCacheByPrefix(CacheKey.NOTE_HOT_LIST).catch(() => {})
    return { id: note.id }
  },

  async submitForReview(id: number) {
    const note = await Note.findByPk(id)
    if (!note) throw new AppError('笔记不存在', 404)
    await note.update({ status: 1 })
    return { id: note.id }
  },

  async audit(id: number, data: { status: number; rejectReason?: string; reviewLevel?: number }) {
    const note = await Note.findByPk(id)
    if (!note) throw new AppError('笔记不存在', 404)
    const updateData: any = { status: data.status }
    if (data.rejectReason) updateData.rejectReason = data.rejectReason
    if (data.reviewLevel) updateData.reviewLevel = data.reviewLevel
    if (data.status === 2) updateData.publishTime = new Date()
    await note.update(updateData)
    delCacheByPrefix(`${CacheKey.NOTE_DETAIL}${id}`).catch(() => {})
    delCacheByPrefix(CacheKey.NOTE_HOT_LIST).catch(() => {})
    return { id: note.id }
  },

  async batchAudit(ids: number[], data: { status: number; rejectReason?: string }) {
    await Note.update(
      { status: data.status, rejectReason: data.rejectReason || '', publishTime: data.status === 2 ? new Date() : undefined },
      { where: { id: { [Op.in]: ids } } }
    )
    delCacheByPrefix(CacheKey.NOTE_HOT_LIST).catch(() => {})
    for (const id of ids) {
      delCacheByPrefix(`${CacheKey.NOTE_DETAIL}${id}`).catch(() => {})
    }
    return true
  },

  async remove(id: number) {
    const note = await Note.findByPk(id)
    if (!note) throw new AppError('笔记不存在', 404)
    await note.destroy()
    delCacheByPrefix(`${CacheKey.NOTE_DETAIL}${id}`).catch(() => {})
    delCacheByPrefix(CacheKey.NOTE_HOT_LIST).catch(() => {})
    return true
  },

  async batchChangeStatus(ids: number[], status: number, reason?: string) {
    const notes = await Note.findAll({ where: { id: { [Op.in]: ids } } })
    if (notes.length === 0) throw new AppError('笔记不存在', 404)

    const validTransitions: Record<number, number[]> = {
      0: [1],
      1: [2, 3],
      2: [4],
      3: [0],
      4: [2]
    }

    for (const note of notes) {
      const from = note.status
      if (!validTransitions[from]?.includes(status)) {
        throw new AppError(`状态变更无效：无法从状态${from}变更为状态${status}`, 400)
      }
    }

    const updateData: any = { status }
    if (reason) updateData.rejectReason = reason
    if (status === 2) updateData.publishTime = new Date()

    await Note.update(updateData, { where: { id: { [Op.in]: ids } } })

    delCacheByPrefix(CacheKey.NOTE_HOT_LIST).catch(() => {})
    for (const id of ids) {
      delCacheByPrefix(`${CacheKey.NOTE_DETAIL}${id}`).catch(() => {})
    }

    await operationLogService.create({
      module: 'note',
      action: 'batchChangeStatus',
      params: JSON.stringify({ ids, status, reason })
    })

    return true
  },

  async incrementView(id: number) {
    const note = await Note.findByPk(id)
    if (!note) throw new AppError('笔记不存在', 404)
    await note.increment('viewCount', { by: 1 })
    return true
  },

  async incrementLike(id: number) {
    const note = await Note.findByPk(id)
    if (!note) throw new AppError('笔记不存在', 404)
    await note.increment('likeCount', { by: 1 })
    return true
  },

  async incrementShare(id: number) {
    const note = await Note.findByPk(id)
    if (!note) throw new AppError('笔记不存在', 404)
    await note.increment('shareCount', { by: 1 })
    return true
  },

  async incrementComment(id: number) {
    const note = await Note.findByPk(id)
    if (!note) throw new AppError('笔记不存在', 404)
    await note.increment('commentCount', { by: 1 })
    return true
  },

  async getHotList(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params
    const cacheKey = `${CacheKey.NOTE_HOT_LIST}:${page}:${pageSize}`
    return getWithFallback(
      cacheKey,
      async () => {
        const where = { status: 2 }

        const { count, rows } = await Note.findAndCountAll({
          where,
          attributes: {
            include: [
              [
                literal('view_count * 0.4 + like_count * 2 + comment_count * 3 + share_count * 5'),
                'hotScore'
              ]
            ]
          },
          offset: (page - 1) * pageSize,
          limit: pageSize,
          order: [[literal('hotScore'), 'DESC']]
        })

        return { list: rows, total: count, page, pageSize }
      },
      CacheTTL.FIVE_MINUTES
    )
  },

  async getStats() {
    const total = await Note.count()
    const draft = await Note.count({ where: { status: 0 } })
    const pendingReview = await Note.count({ where: { status: 1 } })
    const published = await Note.count({ where: { status: 2 } })
    const rejected = await Note.count({ where: { status: 3 } })
    const offShelf = await Note.count({ where: { status: 4 } })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayNew = await Note.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    const todayViewResult = await Note.sum('viewCount', {
      where: { createTime: { [Op.gte]: todayStart } }
    })
    const todayView = todayViewResult || 0

    return {
      total,
      draft,
      pendingReview,
      published,
      rejected,
      offShelf,
      todayNew,
      todayView
    }
  },

  async getTrendData(days: number) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const results = await Note.findAll({
      where: {
        createTime: { [Op.gte]: startDate },
        status: 2
      },
      attributes: [
        [fn('DATE', col('create_time')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE', col('create_time'))],
      order: [[fn('DATE', col('create_time')), 'ASC']],
      raw: true
    })

    return results.map((item: any) => ({
      date: item.date,
      count: item.count
    }))
  }
}
