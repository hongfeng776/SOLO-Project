const CommentManageService = require('../services/CommentManageService');
const { success, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

const SINGLE_OPERATION_TYPES = ['PIN', 'CANCEL_PIN', 'ESSENCE', 'CANCEL_ESSENCE', 'BLOCK', 'DELETE'];
const BATCH_OPERATION_TYPES = ['BATCH_PIN', 'BATCH_BLOCK', 'BATCH_DELETE', 'BATCH_CLEAN'];

class CommentManageController {
  getCommentManageList = [
    validate(paginationSchema.keys({
      contentCategory: Joi.number().integer().allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
      userLevel: Joi.number().integer().allow(null, ''),
      violationStatus: Joi.number().integer().allow(null, ''),
      auditStatus: Joi.number().integer().allow(null, ''),
      commentStatus: Joi.number().integer().allow(null, ''),
      isTop: Joi.number().integer().allow(null, ''),
      isEssence: Joi.number().integer().allow(null, ''),
      isHot: Joi.number().integer().allow(null, ''),
      minReportCount: Joi.number().integer().min(0).allow(null, ''),
      maxReportCount: Joi.number().integer().min(0).allow(null, ''),
      minLikeCount: Joi.number().integer().min(0).allow(null, ''),
      maxLikeCount: Joi.number().integer().min(0).allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CommentManageService.getCommentManageList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  operateComment = [
    validate(Joi.object({
      id: Joi.number().integer().required(),
    }), 'params'),
    validate(Joi.object({
      operationType: Joi.string().valid(...SINGLE_OPERATION_TYPES).required(),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CommentManageService.operateComment(
          parseInt(req.params.id),
          req.body.operationType,
          req.user?.userId,
          req.user?.username,
          req.ip,
          req.body.remark
        );
        return success(res, result, '操作成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  batchOperateComments = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).max(200).required(),
      operationType: Joi.string().valid(...BATCH_OPERATION_TYPES).required(),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CommentManageService.batchOperateComments(
          req.body.ids,
          req.body.operationType,
          req.user?.userId,
          req.user?.username,
          req.ip,
          req.body.remark
        );
        return success(res, result, `批量操作完成：成功${result.successCount}条，跳过${result.skippedCount}条，失败${result.failedCount}条`);
      } catch (error) {
        next(error);
      }
    },
  ];

  traceComment = [
    validate(Joi.object({
      commentId: Joi.number().integer().allow(null, ''),
      contentId: Joi.number().integer().allow(null, ''),
      userUid: Joi.string().trim().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CommentManageService.traceComment(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkDuplicateOperation = [
    validate(Joi.object({
      id: Joi.number().integer().required(),
    }), 'params'),
    validate(Joi.object({
      operationType: Joi.string().valid(...SINGLE_OPERATION_TYPES, ...BATCH_OPERATION_TYPES).required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CommentManageService.checkDuplicateOperation(
          parseInt(req.params.id),
          req.query.operationType
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  validateOperation = [
    validate(Joi.object({
      id: Joi.number().integer().required(),
    }), 'params'),
    validate(Joi.object({
      operationType: Joi.string().valid(...SINGLE_OPERATION_TYPES).required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CommentManageService.validateOperation(
          parseInt(req.params.id),
          req.query.operationType
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new CommentManageController();
