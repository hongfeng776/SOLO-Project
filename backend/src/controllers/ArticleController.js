const ArticleService = require('../services/ArticleService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class ArticleController {
  getList = [
    validate(paginationSchema.keys({
      category: Joi.number().integer().allow(null, ''),
      articleType: Joi.number().integer().allow(null, ''),
      domainCategory: Joi.number().integer().allow(null, ''),
      publishChannel: Joi.string().trim().allow(null, ''),
      publishPermission: Joi.number().integer().allow(null, ''),
      topicId: Joi.number().integer().allow(null, ''),
      publishAccount: Joi.string().trim().allow(null, ''),
      isTop: Joi.number().integer().valid(0, 1).allow(null, ''),
      articleQuality: Joi.number().integer().valid(0, 1, 2, 3).allow(null, ''),
      isExpired: Joi.number().integer().valid(0, 1).allow(null, ''),
      viewCountMin: Joi.number().integer().min(0).allow(null, ''),
      likeCountMin: Joi.number().integer().min(0).allow(null, ''),
      dateRange: Joi.array().items(Joi.date()).length(2).allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ArticleService.getArticleList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getDetail = [
    async (req, res, next) => {
      try {
        const result = await ArticleService.getArticleDetail(parseInt(req.params.id));
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
      description: Joi.string().allow(null, ''),
      coverImage: Joi.string().allow(null, ''),
      tags: Joi.array().items(Joi.string()).allow(null, ''),
      articleType: Joi.number().integer().allow(null, ''),
      domainCategory: Joi.number().integer().allow(null, ''),
      publishChannel: Joi.string().valid('app', 'web', 'mp', 'all').allow(null, ''),
      publishPermission: Joi.number().integer().valid(0, 1, 2).allow(null, ''),
      publishAccount: Joi.string().allow(null, ''),
      topicId: Joi.number().integer().allow(null, ''),
      topicTitle: Joi.string().allow(null, ''),
      articleQuality: Joi.number().integer().valid(0, 1, 2, 3).allow(null, ''),
      layoutTemplate: Joi.string().valid('default', 'magazine', 'news', 'blog').allow(null, ''),
      creatorUid: Joi.string().allow(null, ''),
      creatorLevel: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        const id = await ArticleService.createArticle(
          req.body,
          req.user?.userId,
          req.user?.username,
          ip
        );
        return created(res, { id }, '图文创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  update = [
    validate(Joi.object({
      title: Joi.string().max(255),
      subtitle: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      coverImage: Joi.string().allow(null, ''),
      tags: Joi.array().items(Joi.string()).allow(null, ''),
      articleType: Joi.number().integer().allow(null, ''),
      domainCategory: Joi.number().integer().allow(null, ''),
      publishChannel: Joi.string().valid('app', 'web', 'mp', 'all').allow(null, ''),
      publishPermission: Joi.number().integer().valid(0, 1, 2).allow(null, ''),
      publishAccount: Joi.string().allow(null, ''),
      topicId: Joi.number().integer().allow(null, ''),
      topicTitle: Joi.string().allow(null, ''),
      articleQuality: Joi.number().integer().valid(0, 1, 2, 3).allow(null, ''),
      layoutTemplate: Joi.string().valid('default', 'magazine', 'news', 'blog').allow(null, ''),
      isTop: Joi.number().integer().valid(0, 1),
      editMode: Joi.number().integer().valid(0, 1),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        const { editMode, ...updateData } = req.body;
        const result = await ArticleService.updateArticle(
          parseInt(req.params.id),
          updateData,
          { editMode },
          req.user?.userId,
          req.user?.username,
          ip
        );
        return success(res, result, result.needAudit ? '更新成功，新版本待审核' : '图文更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  publishVersion = [
    validate(Joi.object({
      versionNo: Joi.number().integer().min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        await ArticleService.publishArticleVersion(
          parseInt(req.params.id),
          req.body.versionNo,
          req.user?.userId,
          req.user?.username,
          ip
        );
        return success(res, null, '版本发布成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  getVersionList = [
    async (req, res, next) => {
      try {
        const result = await ArticleService.getVersionList(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getVersionDetail = [
    async (req, res, next) => {
      try {
        const result = await ArticleService.getVersionDetail(req.params.versionId);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchTop = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      topDays: Joi.number().integer().min(1).max(365).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await ArticleService.batchTopArticles(req.body.ids, req.body.topDays);
        return success(res, result, `批量置顶完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchOffline = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      reason: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await ArticleService.batchOfflineArticles(req.body.ids, req.body.reason);
        return success(res, result, `批量下架完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchClassify = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      topicId: Joi.number().integer().required(),
      topicTitle: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await ArticleService.batchClassifyToTopic(
          req.body.ids,
          req.body.topicId,
          req.body.topicTitle
        );
        return success(res, result, `批量归类完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  checkTitle = [
    validate(Joi.object({
      title: Joi.string().required().max(255),
      excludeId: Joi.number().integer().allow(null, ''),
      category: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ArticleService.checkTitleUnique(
          req.query.title,
          req.query.excludeId ? parseInt(req.query.excludeId, 10) : null,
          req.query.category ? parseInt(req.query.category, 10) : undefined
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  checkContent = [
    validate(Joi.object({
      hash: Joi.string().required().max(255),
      excludeId: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ArticleService.checkContentHash(
          req.query.hash,
          req.query.excludeId ? parseInt(req.query.excludeId, 10) : null
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  generateReport = [
    async (req, res, next) => {
      try {
        const result = await ArticleService.generateCheckReport(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new ArticleController();
