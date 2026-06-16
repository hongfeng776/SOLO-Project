const BaseService = require('./BaseService');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

class NotificationService extends BaseService {
  constructor() {
    super(Notification);
  }

  async sendNotification(data) {
    return await this.create(data);
  }

  async getNotifications(userId, params = {}) {
    return super.getList({ ...params, userId }, {
      searchFields: ['title', 'content'],
      defaultOrder: [['id', 'DESC']]
    });
  }

  async markRead(id) {
    const notification = await this.getById(id);
    return await notification.update({ isRead: 1 });
  }

  async markAllRead(userId) {
    await Notification.update(
      { isRead: 1 },
      { where: { userId, isRead: 0 } }
    );
    return true;
  }

  async getUnreadCount(userId) {
    const count = await Notification.count({
      where: { userId, isRead: 0 }
    });
    return count;
  }
}

module.exports = new NotificationService();
