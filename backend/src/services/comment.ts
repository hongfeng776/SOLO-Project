import { Comment, Note } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import { noteService } from './note'

export const commentService = {
  async list(params: {
    page: number
    pageSize: number
    noteId?: number
    status?: number
    keyword?: string
    userId?: number
  }) {
    const { page, pageSize, noteId, status, keyword, userId } = params
    const where: any = {}

    if (noteId !== undefined) where.noteId = noteId
    if (status !== undefined) where.status = status
    if (keyword) where.content = { [Op.like]: `%${keyword}%` }
    if (userId !== undefined) where.userId = userId

    const { count, rows } = await Comment.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const comment = await Comment.findByPk(id)
    if (!comment) throw new AppError('评论不存在', 404)
    return comment
  },

  async create(data: {
    noteId: number
    userId: number
    nickname: string
    avatar?: string
    content: string
    parentId?: number
    replyTo?: string
  }) {
    const note = await Note.findByPk(data.noteId)
    if (!note) throw new AppError('笔记不存在', 404)

    const comment = await Comment.create({ ...data, status: 1 } as any)
    await noteService.incrementComment(data.noteId)
    return { id: comment.id }
  },

  async update(id: number, data: Partial<{ content: string }>) {
    const comment = await Comment.findByPk(id)
    if (!comment) throw new AppError('评论不存在', 404)
    await comment.update(data)
    return { id: comment.id }
  },

  async remove(id: number) {
    const comment = await Comment.findByPk(id)
    if (!comment) throw new AppError('评论不存在', 404)
    await comment.destroy()
    return true
  },

  async batchRemove(ids: number[]) {
    await Comment.destroy({ where: { id: { [Op.in]: ids } } })
    return true
  },

  async audit(id: number, data: { status: number; violationType?: string }) {
    const comment = await Comment.findByPk(id)
    if (!comment) throw new AppError('评论不存在', 404)
    const updateData: any = { status: data.status }
    if (data.violationType) updateData.violationType = data.violationType
    await comment.update(updateData)
    return { id: comment.id }
  },

  async batchAudit(ids: number[], data: { status: number }) {
    await Comment.update(
      { status: data.status },
      { where: { id: { [Op.in]: ids } } }
    )
    return true
  },

  async getListByNoteId(noteId: number, params: { page: number; pageSize: number }) {
    const { page, pageSize } = params

    const { count, rows } = await Comment.findAndCountAll({
      where: { noteId, status: 1, parentId: 0 },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async getStats() {
    const total = await Comment.count()
    const pending = await Comment.count({ where: { status: 0 } })
    const approved = await Comment.count({ where: { status: 1 } })
    const rejected = await Comment.count({ where: { status: 2 } })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayNew = await Comment.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    return { total, pending, approved, rejected, todayNew }
  }
}
