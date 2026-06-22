const InteractionAnalyticsService = require('../services/InteractionAnalyticsService');
const { success, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class InteractionAnalyticsController {
  getInteractionStats = [
    validate(paginationSchema.keys({
      contentCategory: Joi.number().integer().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      interactionTypes: Joi.string().trim().required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await InteractionAnalyticsService.aggregateInteractionStats(req.query);
        return paginated(res, {
          list: result.list,
          total: result.total,
          page: 1,
          pageSize: result.total,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getInteractionTrend = [
    validate(Joi.object({
      contentCategory: Joi.number().integer().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      interactionTypes: Joi.string().trim().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await InteractionAnalyticsService.getInteractionTrend(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getCategoryComparison = [
    validate(Joi.object({
      contentCategories: Joi.string().trim().allow(null, ''),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await InteractionAnalyticsService.getCategoryComparison(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  batchExportReport = [
    validate(Joi.object({
      contentCategory: Joi.number().integer().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      sortBy: Joi.string().trim().allow(null, ''),
      sortOrder: Joi.string().valid('ASC', 'DESC').allow(null, ''),
      selectedFields: Joi.array().items(Joi.string().trim()).allow(null, ''),
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(5000).default(1000),
    })),
    async (req, res, next) => {
      try {
        const result = await InteractionAnalyticsService.batchExportReport(req.body);
        return success(res, result, '报表数据生成成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  batchScreenLowInteraction = [
    validate(Joi.object({
      contentCategory: Joi.number().integer().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      threshold: Joi.number().integer().min(1).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await InteractionAnalyticsService.batchScreenLowInteraction(req.body);
        return success(res, result, `低互动内容筛查完成，共发现${result.total}条低互动内容`);
      } catch (error) {
        next(error);
      }
    },
  ];

  traceInteractionStats = [
    validate(Joi.object({
      statBatch: Joi.string().trim().allow(null, ''),
      contentId: Joi.number().integer().allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await InteractionAnalyticsService.traceInteractionStats(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkDuplicateStat = [
    validate(Joi.object({
      statBatch: Joi.string().trim().required(),
      contentId: Joi.number().integer().required(),
      statDate: Joi.date().required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await InteractionAnalyticsService.checkDuplicateStat(
          req.query.statBatch,
          req.query.contentId,
          req.query.statDate
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  validateInteractionConsistency = [
    validate(Joi.object({
      contentId: Joi.number().integer().required(),
      statDate: Joi.date().required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await InteractionAnalyticsService.validateInteractionConsistency(
          req.query.contentId,
          req.query.statDate
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new InteractionAnalyticsController();
