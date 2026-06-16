const MessageService = require('../services/MessageService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class MessageController {
  getMessageList = [
    validate(paginationSchema.keys({
      type: Joi.number().integer().allow(null, ''),
      isRead: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MessageService.getMessageList(req.query, req.user.userId);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getMessageById = [
    async (req, res, next) => {
      try {
        const result = await MessageService.getMessageById(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  createMessage = [
    validate(Joi.object({
      userId: Joi.number().integer().required(),
      title: Joi.string().required().max(255),
      content: Joi.string().required(),
      type: Joi.number().integer(),
    })),
    async (req, res, next) => {
      try {
        const id = await MessageService.createMessage(req.body);
        return created(res, { id }, '消息创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  markAsRead = [
    async (req, res, next) => {
      try {
        await MessageService.markAsRead(parseInt(req.params.id), req.user.userId);
        return success(res, null, '标记已读成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  markAllAsRead = [
    async (req, res, next) => {
      try {
        await MessageService.markAllAsRead(req.user.userId);
        return success(res, null, '全部标记已读成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  deleteMessage = [
    async (req, res, next) => {
      try {
        await MessageService.deleteMessage(parseInt(req.params.id));
        return success(res, null, '消息删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  getUnreadCount = [
    async (req, res, next) => {
      try {
        const result = await MessageService.getUnreadCount(req.user.userId);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new MessageController();
