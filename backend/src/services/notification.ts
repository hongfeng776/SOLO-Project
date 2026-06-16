import { Notification } from '@models/index'
import { AppError } from '@utils/response'

export const notificationService = {
  async list(params: {
    page: number
    pageSize: number
    type?: string
    status?: number
    userId?: number
    isRead?: boolean
  }) {
    const { page, pageSize, type, status, userId, isRead } = params
    const where: any = {}

    if (type) where.type = type
    if (status !== undefined) where.status = status
    if (isRead !== undefined) where.status = isRead ? 1 : 0
    if (userId !== undefined) where.userId = userId

    const { count, rows } = await Notification.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number, userId?: number) {
    const notification = await Notification.findByPk(id)
    if (!notification) throw new AppError('通知不存在', 404)
    if (userId !== undefined && notification.userId !== userId) {
      throw new AppError('无权查看此通知', 403)
    }
    return notification
  },

  async create(data: {
    userId: number
    type: string
    title: string
    content: string
    relatedId?: number
    relatedType?: string
  }) {
    const notification = await Notification.create(data as any)
    return { id: notification.id }
  },

  async batchCreate(data: {
    userIds: number[]
    type: string
    title: string
    content: string
    relatedId?: number
    relatedType?: string
  }) {
    const notifications = data.userIds.map((userId) => ({
      userId,
      type: data.type,
      title: data.title,
      content: data.content,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
      status: 0
    }))
    await Notification.bulkCreate(notifications as any)
    return true
  },

  async markAsRead(id: number, userId: number) {
    const notification = await Notification.findByPk(id)
    if (!notification) throw new AppError('通知不存在', 404)
    if (notification.userId !== userId) {
      throw new AppError('无权操作此通知', 403)
    }
    await notification.update({ status: 1, readTime: new Date() })
    return true
  },

  async markAllAsRead(userId: number) {
    await Notification.update(
      { status: 1, readTime: new Date() },
      { where: { userId, status: 0 } }
    )
    return true
  },

  async getUnreadCount(userId: number) {
    const count = await Notification.count({
      where: { userId, status: 0 }
    })
    return { count }
  },

  async remove(id: number, userId?: number) {
    const notification = await Notification.findByPk(id)
    if (!notification) throw new AppError('通知不存在', 404)
    if (userId !== undefined && notification.userId !== userId) {
      throw new AppError('无权删除此通知', 403)
    }
    await notification.destroy()
    return true
  }
}
