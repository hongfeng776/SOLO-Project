const { success, pagination } = require('../utils/result');
const notificationService = require('../services/NotificationService');

class NotificationController {
  async list(req, res, next) {
    try {
      const { pageNum, pageSize } = req.pagination;
      const userId = req.user.id;
      const params = { ...req.query, pageNum, pageSize };
      const result = await notificationService.getNotifications(userId, params);
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await notificationService.getUnreadCount(userId);
      res.json(success({ count }));
    } catch (error) {
      next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      const { id } = req.params;
      await notificationService.markRead(id);
      res.json(success(null, '标记已读成功'));
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req, res, next) {
    try {
      const userId = req.user.id;
      await notificationService.markAllRead(userId);
      res.json(success(null, '全部标记已读成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
