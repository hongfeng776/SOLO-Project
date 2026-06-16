const { Notification } = require('../models')
const { getPagination } = require('../utils/common')
const ApiError = require('../utils/apiError')

class NotificationService {
  async getList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.userId) {
      where.userId = params.userId
    }

    if (params.type) {
      where.type = params.type
    }

    if (params.isRead !== undefined && params.isRead !== '') {
      where.isRead = params.isRead === 'true' || params.isRead === true
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  }

  async getUnreadCount(userId) {
    const count = await Notification.count({
      where: {
        userId,
        isRead: false
      }
    })

    return count
  }

  async markAsRead(id) {
    const notification = await Notification.findByPk(id)

    if (!notification) {
      throw ApiError.notFound('通知不存在')
    }

    await notification.update({
      isRead: true,
      readTime: new Date()
    })

    return notification
  }

  async markAllAsRead(userId) {
    const result = await Notification.update(
      {
        isRead: true,
        readTime: new Date()
      },
      {
        where: {
          userId,
          isRead: false
        }
      }
    )

    return result[0]
  }

  async create(data) {
    const notification = await Notification.create(data)
    return notification
  }
}

module.exports = new NotificationService()
