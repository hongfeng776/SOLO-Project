const ShortVideoService = require('../services/ShortVideoService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class ShortVideoController {
  getList = [
    validate(paginationSchema.keys({
      status: Joi.number().integer().allow(null, ''),
      auditStatus: Joi.number().integer().allow(null, ''),
      creatorId: Joi.number().integer().allow(null, ''),
      creatorLevel: Joi.number().integer().allow(null, ''),
      hotScoreMin: Joi.number().allow(null, ''),
      hotScoreMax: Joi.number().allow(null, ''),
      publishBatch: Joi.string().trim().allow(null, ''),
      violationCount: Joi.number().integer().min(0).allow(null, ''),
      isArchived: Joi.number().integer().valid(0, 1).allow(null, ''),
      contentRating: Joi.number().integer().valid(0, 1, 2).allow(null, ''),
      videoQuality: Joi.number().integer().valid(0, 1, 2, 3).allow(null, ''),
      dateRange: Joi.array().items(Joi.date()).length(2).allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ShortVideoService.getShortVideoList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getDetail = [
    async (req, res, next) => {
      try {
        const result = await ShortVideoService.getShortVideoDetail(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  create = [
    validate(Joi.object({
      title: Joi.string().required().max(255),
      subtitle: Joi.string().allow(null, ''),
      coverImage: Joi.string().allow(null, ''),
      posterImage: Joi.string().allow(null, ''),
      videoUrl: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      tags: Joi.array().items(Joi.string()).allow(null, ''),
      videoFingerprint: Joi.string().max(100).allow(null, ''),
      videoDuration: Joi.number().min(0).max(600).allow(null, ''),
      videoFormat: Joi.string().valid('mp4', 'webm', 'mov').allow(null, ''),
      videoQuality: Joi.number().integer().valid(0, 1, 2, 3).allow(null, ''),
      fileSize: Joi.number().integer().min(0).allow(null, ''),
      bitrateKbps: Joi.number().integer().min(0).allow(null, ''),
      frameRate: Joi.number().integer().min(0).allow(null, ''),
      creatorId: Joi.number().integer().allow(null, ''),
      creatorUid: Joi.string().allow(null, ''),
      creatorLevel: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
      hotScore: Joi.number().allow(null, ''),
      publishBatch: Joi.string().allow(null, ''),
      contentRating: Joi.number().integer().valid(0, 1, 2).allow(null, ''),
      isHot: Joi.number().integer().valid(0, 1),
      isRecommend: Joi.number().integer().valid(0, 1),
      isVip: Joi.number().integer().valid(0, 1),
      sortOrder: Joi.number().integer(),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        const id = await ShortVideoService.createShortVideo(req.body, req.user?.userId, ip);
        return created(res, { id }, '短视频创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  update = [
    validate(Joi.object({
      title: Joi.string().max(255),
      subtitle: Joi.string().allow(null, ''),
      coverImage: Joi.string().allow(null, ''),
      posterImage: Joi.string().allow(null, ''),
      videoUrl: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      tags: Joi.array().items(Joi.string()).allow(null, ''),
      videoFingerprint: Joi.string().max(100).allow(null, ''),
      videoDuration: Joi.number().min(0).max(600).allow(null, ''),
      videoFormat: Joi.string().valid('mp4', 'webm', 'mov').allow(null, ''),
      videoQuality: Joi.number().integer().valid(0, 1, 2, 3).allow(null, ''),
      fileSize: Joi.number().integer().min(0).allow(null, ''),
      bitrateKbps: Joi.number().integer().min(0).allow(null, ''),
      frameRate: Joi.number().integer().min(0).allow(null, ''),
      creatorId: Joi.number().integer().allow(null, ''),
      creatorUid: Joi.string().allow(null, ''),
      creatorLevel: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
      hotScore: Joi.number().allow(null, ''),
      publishBatch: Joi.string().allow(null, ''),
      contentRating: Joi.number().integer().valid(0, 1, 2).allow(null, ''),
      isHot: Joi.number().integer().valid(0, 1),
      isRecommend: Joi.number().integer().valid(0, 1),
      isVip: Joi.number().integer().valid(0, 1),
      sortOrder: Joi.number().integer(),
      status: Joi.number().integer().valid(0, 1, 3, 5),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        await ShortVideoService.updateShortVideo(parseInt(req.params.id), req.body, req.user?.userId, ip);
        return success(res, null, '短视频更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  changeStatus = [
    validate(Joi.object({
      toStatus: Joi.number().integer().required().valid(0, 1, 2, 3, 5),
      reason: Joi.string().allow(null, ''),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        await ShortVideoService.changeStatus(
          parseInt(req.params.id),
          req.body,
          req.user?.userId,
          ip
        );
        return success(res, null, '状态变更成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  batchResetTags = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      newTags: Joi.array().items(Joi.string()).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await ShortVideoService.batchResetTags(req.body.ids, req.body.newTags);
        return success(res, result, `批量重置标签完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchRestore = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      reason: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await ShortVideoService.batchRestoreContents(req.body.ids, req.body.reason);
        return success(res, result, `批量恢复完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchArchive = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await ShortVideoService.batchArchiveContents(req.body.ids);
        return success(res, result, `批量归档完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  checkFingerprint = [
    validate(Joi.object({
      fingerprint: Joi.string().required().max(100),
      excludeId: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ShortVideoService.checkVideoFingerprint(
          req.query.fingerprint,
          req.query.excludeId ? parseInt(req.query.excludeId, 10) : null
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getStatusLogs = [
    async (req, res, next) => {
      try {
        const result = await ShortVideoService.getStatusLogs(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new ShortVideoController();
