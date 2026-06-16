const CommentService = require('../services/CommentService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class CommentController {
  getCommentList = [
    validate(paginationSchema.keys({
      contentId: Joi.number().integer().allow(null, ''),
      status: Joi.number().integer().allow(null, ''),
      auditStatus: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CommentService.getCommentList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getCommentById = [
    async (req, res, next) => {
      try {
        const result = await CommentService.getCommentById(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  createComment = [
    validate(Joi.object({
      contentId: Joi.number().integer().required(),
      parentId: Joi.number().integer().allow(null, ''),
      content: Joi.string().required().max(1000),
      nickname: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const id = await CommentService.createComment(req.body, req.ip);
        return created(res, { id }, '评论创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  updateComment = [
    validate(Joi.object({
      content: Joi.string().max(1000),
      status: Joi.number().integer(),
    })),
    async (req, res, next) => {
      try {
        await CommentService.updateComment(parseInt(req.params.id), req.body);
        return success(res, null, '评论更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  deleteComment = [
    async (req, res, next) => {
      try {
        await CommentService.deleteComment(parseInt(req.params.id));
        return success(res, null, '评论删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  batchDeleteComments = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        await CommentService.batchDeleteComments(req.body.ids);
        return success(res, null, '批量删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  auditComment = [
    validate(Joi.object({
      auditStatus: Joi.number().integer().required(),
      auditRemark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await CommentService.auditComment(parseInt(req.params.id), req.body, req.user.userId);
        return success(res, null, '审核操作成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  batchAuditComments = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      auditStatus: Joi.number().integer().required(),
      auditRemark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const { ids, ...auditData } = req.body;
        await CommentService.batchAuditComments(ids, auditData, req.user.userId);
        return success(res, null, '批量审核成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  getCommentStats = [
    async (req, res, next) => {
      try {
        const result = await CommentService.getCommentStats(req.query.contentId);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new CommentController();
