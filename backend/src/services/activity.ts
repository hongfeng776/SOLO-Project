import { Activity } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

export const activityService = {
  async list(params: { page: number; pageSize: number; keyword?: string; type?: string; status?: number }) {
    const { page, pageSize, keyword, type, status } = params
    const where: any = {}

    if (keyword) where.name = { [Op.like]: `%${keyword}%` }
    if (type) where.type = type
    if (status !== undefined) where.status = status

    const { count, rows } = await Activity.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const activity = await Activity.findByPk(id)
    if (!activity) throw new AppError('活动不存在', 404)
    return activity
  },

  async create(data: { name: string; description?: string; coverImage?: string; type?: string; startTime: string; endTime: string; maxParticipants?: number }) {
    const activity = await Activity.create({ ...data, status: 0, participantCount: 0 } as any)
    return { id: activity.id }
  },

  async update(id: number, data: Partial<{ name: string; description: string; coverImage: string; type: string; startTime: string; endTime: string; status: number; maxParticipants: number }>) {
    const activity = await Activity.findByPk(id)
    if (!activity) throw new AppError('活动不存在', 404)
    await activity.update(data as any)
    return { id: activity.id }
  },

  async remove(id: number) {
    const activity = await Activity.findByPk(id)
    if (!activity) throw new AppError('活动不存在', 404)
    await activity.destroy()
    return true
  }
}
