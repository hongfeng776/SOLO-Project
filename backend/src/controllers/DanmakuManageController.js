const DanmakuManageService = require('../services/DanmakuManageService');
const { success, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

const SINGLE_OPERATION_TYPES = ['APPROVE', 'TEMP_BLOCK', 'PERMA_BAN', 'UNBLOCK', 'DELETE'];
const BATCH_OPERATION_TYPES = ['BATCH_APPROVE', 'BATCH_BLOCK', 'BATCH_CLEAN', 'BATCH_ARCHIVE'];

class DanmakuManageController {
  getDanmakuManageList = [
    validate(paginationSchema.keys({
      contentId: Joi.number().integer().allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
      userId: Joi.number().integer().allow(null, ''),
      violationLevel: Joi.number().integer().allow(null, ''),
      isHighRisk: Joi.number().integer().allow(null, ''),
      danmakuStatus: Joi.number().integer().allow(null, ''),
      playTimeStart: Joi.number().integer().min(0).allow(null, ''),
      playTimeEnd: Joi.number().integer().min(0).allow(null, ''),
      isRealTime: Joi.number().integer().allow(null, ''),
      isArchived: Joi.number().integer().allow(null, ''),
      isHotVideo: Joi.number().integer().allow(null, ''),
      violationType: Joi.string().trim().max(50).allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await DanmakuManageService.getDanmakuManageList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  operateDanmaku = [
    validate(Joi.object({
      id: Joi.number().integer().required(),
    }), 'params'),
    validate(Joi.object({
      operationType: Joi.string().valid(...SINGLE_OPERATION_TYPES).required(),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await DanmakuManageService.operateDanmaku(
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

  batchOperateDanmakus = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).max(200).required(),
      operationType: Joi.string().valid(...BATCH_OPERATION_TYPES).required(),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await DanmakuManageService.batchOperateDanmakus(
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

  traceDanmaku = [
    validate(Joi.object({
      danmakuId: Joi.number().integer().allow(null, ''),
      contentId: Joi.number().integer().allow(null, ''),
      userUid: Joi.string().trim().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await DanmakuManageService.traceDanmaku(req.query);
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
        const result = await DanmakuManageService.checkDuplicateOperation(
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
        const result = await DanmakuManageService.validateOperation(
          parseInt(req.params.id),
          req.query.operationType
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  archiveByContent = [
    validate(Joi.object({
      contentId: Joi.number().integer().required(),
    }), 'params'),
    async (req, res, next) => {
      try {
        const result = await DanmakuManageService.archiveDanmakusByContent(
          parseInt(req.params.contentId)
        );
        return success(res, result, result.message);
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new DanmakuManageController();
