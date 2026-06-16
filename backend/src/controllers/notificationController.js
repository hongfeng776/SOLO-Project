const { Op } = require('sequelize')
const { Notification } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      type,
      isRead
    } = req.query

    const userId = req.user ? req.user.id : null

    const where = {
      [Op.or]: [
        { targetType: 1 },
        ...(userId ? [{ targetType: 3, targetId: userId }] : [])
      ]
    }

    if (type !== undefined && type !== '') where.type = type
    if (isRead !== undefined && isRead !== '') where.isRead = isRead

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null

    const where = {
      isRead: 0,
      [Op.or]: [
        { targetType: 1 },
        ...(userId ? [{ targetType: 3, targetId: userId }] : [])
      ]
    }

    const count = await Notification.count({ where })
    res.json(success(count))
  } catch (error) {
    next(error)
  }
}

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params
    const notification = await Notification.findByPk(id)
    if (!notification) throw new AppError('消息不存在', 404, 404)

    await notification.update({ isRead: 1, readTime: new Date() })
    res.json(success(null, '标记已读成功'))
  } catch (error) {
    next(error)
  }
}

const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null

    const where = {
      isRead: 0,
      [Op.or]: [
        { targetType: 1 },
        ...(userId ? [{ targetType: 3, targetId: userId }] : [])
      ]
    }

    await Notification.update(
      { isRead: 1, readTime: new Date() },
      { where }
    )

    res.json(success(null, '全部标记已读成功'))
  } catch (error) {
    next(error)
  }
}

const send = async (req, res, next) => {
  try {
    const data = req.body
    if (req.user) {
      data.senderId = req.user.id
      data.senderName = req.user.nickname || req.user.username
    }
    const notification = await Notification.create(data)
    res.json(success(notification, '发送成功'))
  } catch (error) {
    next(error)
  }
}

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params
    const notification = await Notification.findByPk(id)
    if (!notification) throw new AppError('消息不存在', 404, 404)
    await notification.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getUnreadCount,
  markRead,
  markAllRead,
  send,
  deleteNotification
}
