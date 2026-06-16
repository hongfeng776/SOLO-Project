const { Op } = require('sequelize')
const { Notification, User, Role } = require('../models')
const { AppError } = require('../utils/response')

const sendNotification = async (data) => {
  const notification = await Notification.create(data)
  return notification
}

const sendToUser = async (userId, title, content, type = 2) => {
  const notification = await Notification.create({
    title,
    content,
    type,
    targetType: 3,
    targetId: userId,
    priority: 1
  })
  return notification
}

const sendToRole = async (role, title, content, type = 1) => {
  const notification = await Notification.create({
    title,
    content,
    type,
    targetType: 2,
    targetId: role,
    priority: 1
  })
  return notification
}

const sendSystemNotice = async (title, content) => {
  const notification = await Notification.create({
    title,
    content,
    type: 1,
    targetType: 1,
    targetId: 0,
    priority: 1
  })
  return notification
}

const markAsRead = async (notificationId) => {
  const notification = await Notification.findByPk(notificationId)
  if (!notification) {
    throw new AppError('通知不存在', 404, 404)
  }
  await notification.update({
    isRead: 1,
    readTime: new Date()
  })
  return notification
}

const markAllAsRead = async (userId) => {
  const [count] = await Notification.update(
    { isRead: 1, readTime: new Date() },
    {
      where: {
        targetId: userId,
        targetType: 3,
        isRead: 0
      }
    }
  )
  return { updatedCount: count }
}

const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: {
      targetId: userId,
      targetType: 3,
      isRead: 0
    }
  })
  return count
}

module.exports = {
  sendNotification,
  sendToUser,
  sendToRole,
  sendSystemNotice,
  markAsRead,
  markAllAsRead,
  getUnreadCount
}
