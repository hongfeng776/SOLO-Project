const notificationService = require('../services/notificationService')
const ApiResponse = require('../utils/response')

class NotificationController {
  async getList(req, res, next) {
    try {
      const params = {
        ...req.query,
        userId: req.query.userId || req.user.id
      }
      const result = await notificationService.getList(params)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id
      const count = await notificationService.getUnreadCount(userId)
      res.json(ApiResponse.success({ count }))
    } catch (error) {
      next(error)
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params
      const notification = await notificationService.markAsRead(parseInt(id))
      res.json(ApiResponse.success(notification, '标记已读成功'))
    } catch (error) {
      next(error)
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id
      const count = await notificationService.markAllAsRead(userId)
      res.json(ApiResponse.success({ count }, '全部标记已读成功'))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const notification = await notificationService.create(req.body)
      res.json(ApiResponse.success(notification, '创建通知成功'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new NotificationController()
