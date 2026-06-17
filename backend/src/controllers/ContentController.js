const ContentService = require('../services/ContentService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class ContentController {
  getList = [
    validate(paginationSchema.keys({
      category: Joi.number().integer().allow(null, ''),
      auditStatus: Joi.number().integer().allow(null, ''),
      copyrightId: Joi.number().integer().allow(null, ''),
      status: Joi.number().integer().valid(0, 1).allow(null, ''),
      releaseYear: Joi.number().integer().allow(null, ''),
      isVip: Joi.number().integer().valid(0, 1).allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ContentService.getContentList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getById = [
    async (req, res, next) => {
      try {
        const result = await ContentService.getContentById(parseInt(req.params.id));
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
      category: Joi.number().integer().required(),
      coverImage: Joi.string().allow(null, ''),
      posterImage: Joi.string().allow(null, ''),
      videoUrl: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      director: Joi.string().allow(null, ''),
      actors: Joi.string().allow(null, ''),
      releaseYear: Joi.number().integer().allow(null, ''),
      releaseDate: Joi.date().allow(null, ''),
      duration: Joi.number().integer().allow(null, ''),
      area: Joi.string().allow(null, ''),
      language: Joi.string().allow(null, ''),
      tags: Joi.array().items(Joi.string()).allow(null, ''),
      totalEpisodes: Joi.number().integer().allow(null, ''),
      updatedEpisodes: Joi.number().integer().allow(null, ''),
      copyrightId: Joi.number().integer().allow(null, ''),
      copyrightType: Joi.number().integer().allow(null, ''),
      auditStatus: Joi.number().integer(),
      isHot: Joi.number().integer().valid(0, 1),
      isRecommend: Joi.number().integer().valid(0, 1),
      isVip: Joi.number().integer().valid(0, 1),
      sortOrder: Joi.number().integer(),
      status: Joi.number().integer().valid(0, 1),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const id = await ContentService.createContent(req.body, req.user?.userId);
        return created(res, { id }, '内容创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  update = [
    validate(Joi.object({
      title: Joi.string().max(255),
      subtitle: Joi.string().allow(null, ''),
      category: Joi.number().integer(),
      coverImage: Joi.string().allow(null, ''),
      posterImage: Joi.string().allow(null, ''),
      videoUrl: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      director: Joi.string().allow(null, ''),
      actors: Joi.string().allow(null, ''),
      releaseYear: Joi.number().integer().allow(null, ''),
      releaseDate: Joi.date().allow(null, ''),
      duration: Joi.number().integer().allow(null, ''),
      area: Joi.string().allow(null, ''),
      language: Joi.string().allow(null, ''),
      tags: Joi.array().items(Joi.string()).allow(null, ''),
      totalEpisodes: Joi.number().integer().allow(null, ''),
      updatedEpisodes: Joi.number().integer().allow(null, ''),
      copyrightId: Joi.number().integer().allow(null, ''),
      copyrightType: Joi.number().integer().allow(null, ''),
      isHot: Joi.number().integer().valid(0, 1),
      isRecommend: Joi.number().integer().valid(0, 1),
      isVip: Joi.number().integer().valid(0, 1),
      sortOrder: Joi.number().integer(),
      status: Joi.number().integer().valid(0, 1),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await ContentService.updateContent(parseInt(req.params.id), req.body, req.user?.userId);
        return success(res, null, '内容更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  delete = [
    async (req, res, next) => {
      try {
        await ContentService.deleteContent(parseInt(req.params.id));
        return success(res, null, '内容删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  batchDelete = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        await ContentService.batchDeleteContents(req.body.ids);
        return success(res, null, '批量删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  audit = [
    validate(Joi.object({
      auditStatus: Joi.number().integer().required(),
      auditRemark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await ContentService.auditContent(parseInt(req.params.id), req.body, req.user?.userId);
        return success(res, null, '审核操作成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  batchAudit = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      auditStatus: Joi.number().integer().required(),
      auditRemark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const { ids, ...auditData } = req.body;
        await ContentService.batchAuditContents(ids, auditData, req.user?.userId);
        return success(res, null, '批量审核成功');
      } catch (error) {
        next(error);
      }
    }
  ];
  batchOffline = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await ContentService.batchOfflineContents(req.body.ids);
        return success(res, result, `批量下架完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchTop = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await ContentService.batchTopContents(req.body.ids);
        return success(res, result, `批量置顶完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchUpdateCategory = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      category: Joi.number().integer().required(),
    })),
    async (req, res, next) => {
      try {
        const result = await ContentService.batchUpdateCategory(req.body.ids, req.body.category);
        return success(res, result, `批量修改分类完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  checkTitleUnique = [
    validate(Joi.object({
      title: Joi.string().required(),
      excludeId: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const isUnique = await ContentService.checkTitleUnique(req.query.title, req.query.excludeId);
        return success(res, { isUnique });
      } catch (error) {
        next(error);
      }
    }
  ];

  checkCopyrightUnique = [
    validate(Joi.object({
      copyrightId: Joi.number().integer().required(),
      excludeId: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const isUnique = await ContentService.checkCopyrightIdUnique(req.query.copyrightId, req.query.excludeId);
        return success(res, { isUnique });
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new ContentController();
