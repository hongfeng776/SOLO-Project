import { Feedback } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

export const feedbackService = {
  async list(params: {
    page: number
    pageSize: number
    type?: string
    status?: number
    keyword?: string
    userId?: number
  }) {
    const { page, pageSize, type, status, keyword, userId } = params
    const where: any = {}

    if (type) where.type = type
    if (status !== undefined) where.status = status
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (userId !== undefined) where.userId = userId

    const { count, rows } = await Feedback.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const feedback = await Feedback.findByPk(id)
    if (!feedback) throw new AppError('反馈不存在', 404)
    return feedback
  },

  async create(data: {
    userId?: number
    nickname?: string
    type: string
    title: string
    content: string
    images?: string
    contact?: string
  }) {
    const feedback = await Feedback.create({ ...data, status: 0 } as any)
    return { id: feedback.id }
  },

  async update(id: number, data: Partial<{
    type: string
    title: string
    content: string
    images: string
    contact: string
  }>) {
    const feedback = await Feedback.findByPk(id)
    if (!feedback) throw new AppError('反馈不存在', 404)
    await feedback.update(data)
    return { id: feedback.id }
  },

  async remove(id: number) {
    const feedback = await Feedback.findByPk(id)
    if (!feedback) throw new AppError('反馈不存在', 404)
    await feedback.destroy()
    return true
  },

  async handle(id: number, data: {
    handleResult: string
    handlerId?: number
    handlerName?: string
  }) {
    const feedback = await Feedback.findByPk(id)
    if (!feedback) throw new AppError('反馈不存在', 404)
    if (feedback.status === 2 || feedback.status === 3) {
      throw new AppError('该反馈已处理或已关闭', 400)
    }

    await feedback.update({
      status: 2,
      handleResult: data.handleResult,
      handleTime: new Date(),
      handlerId: data.handlerId || 0,
      handlerName: data.handlerName || ''
    })
    return { id: feedback.id }
  },

  async batchHandle(ids: number[], data: {
    handleResult: string
    handlerId?: number
    handlerName?: string
  }) {
    await Feedback.update(
      {
        status: 2,
        handleResult: data.handleResult,
        handleTime: new Date(),
        handlerId: data.handlerId || 0,
        handlerName: data.handlerName || ''
      },
      { where: { id: { [Op.in]: ids }, status: { [Op.in]: [0, 1] } } }
    )
    return true
  },

  async close(id: number) {
    const feedback = await Feedback.findByPk(id)
    if (!feedback) throw new AppError('反馈不存在', 404)
    await feedback.update({ status: 3 })
    return true
  },

  async getStats() {
    const total = await Feedback.count()
    const pending = await Feedback.count({ where: { status: 0 } })
    const processing = await Feedback.count({ where: { status: 1 } })
    const handled = await Feedback.count({ where: { status: 2 } })
    const closed = await Feedback.count({ where: { status: 3 } })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayNew = await Feedback.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    return { total, pending, processing, handled, closed, todayNew }
  }
}
