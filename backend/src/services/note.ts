import { Note, Tag } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

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
    const note = await Note.findByPk(id, {
      include: [{ model: Tag, as: 'tags', attributes: ['id', 'name', 'type'], through: { attributes: [] } }]
    })
    if (!note) throw new AppError('笔记不存在', 404)
    return note
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
    return { id: note.id }
  },

  async batchAudit(ids: number[], data: { status: number; rejectReason?: string }) {
    await Note.update(
      { status: data.status, rejectReason: data.rejectReason || '', publishTime: data.status === 2 ? new Date() : undefined },
      { where: { id: { [Op.in]: ids } } }
    )
    return true
  },

  async remove(id: number) {
    const note = await Note.findByPk(id)
    if (!note) throw new AppError('笔记不存在', 404)
    await note.destroy()
    return true
  }
}
