const ArticleAuditService = require('../services/ArticleAuditService');
const { success, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class ArticleAuditController {
  getAuditPool = [
    validate(paginationSchema.keys({
      auditStatus: Joi.number().integer().allow(null, ''),
      articleType: Joi.number().integer().allow(null, ''),
      domainCategory: Joi.string().allow(null, ''),
      riskLevel: Joi.number().integer().allow(null, ''),
      assignedTo: Joi.number().integer().allow(null, ''),
      articleQuality: Joi.number().integer().allow(null, ''),
      isExpired: Joi.boolean().allow(null, ''),
      publishChannel: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ArticleAuditService.getAuditPool(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getDetail = [
    async (req, res, next) => {
      try {
        const result = await ArticleAuditService.getDetail(parseInt(req.params.articleId));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getAiPreScreen = [
    async (req, res, next) => {
      try {
        const { Content } = require('../models');
        const articleId = parseInt(req.params.articleId);
        const article = await Content.findByPk(articleId);
        if (!article) {
          const { NotFoundError } = require('../utils/errors');
          throw new NotFoundError('图文不存在');
        }
        const result = await ArticleAuditService.runAiPreScreen(article);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkDuplicate = [
    async (req, res, next) => {
      try {
        const result = await ArticleAuditService.checkDuplicate(parseInt(req.params.articleId));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkConsistency = [
    validate(Joi.object({
      contentHash: Joi.string().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const { Content } = require('../models');
        const articleId = parseInt(req.params.articleId);
        const article = await Content.findByPk(articleId);
        if (!article) {
          const { NotFoundError } = require('../utils/errors');
          throw new NotFoundError('图文不存在');
        }
        const result = ArticleAuditService.checkContentConsistency(article, req.query.contentHash);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  handleAiRisk = [
    validate(Joi.object({
      handled: Joi.boolean().required(),
    })),
    async (req, res, next) => {
      try {
        const articleId = parseInt(req.params.articleId);
        const riskType = req.params.riskType;
        const result = await ArticleAuditService.handleAiRisk(articleId, riskType, req.body.handled);
        return success(res, result, 'AI风险处理完成');
      } catch (error) {
        next(error);
      }
    },
  ];

  submitAudit = [
    validate(Joi.object({
      articleId: Joi.number().integer().required(),
      auditStatus: Joi.number().integer().required(),
      auditRemark: Joi.string().allow(null, ''),
      rejectReasonCategory: Joi.string().allow(null, ''),
      rejectReasonDetail: Joi.string().allow(null, ''),
      reviewLevel: Joi.number().integer().min(1).max(3),
      requiredReviewLevel: Joi.number().integer().min(1).max(3),
      nextReviewerId: Joi.number().integer().allow(null),
      aiScore: Joi.number().integer().allow(null),
      aiResult: Joi.string().valid('passed', 'warning', 'failed').allow(null, ''),
      riskLevel: Joi.number().integer().min(1).max(4).allow(null),
      publishPermission: Joi.number().integer().allow(null),
      distributionQualification: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await ArticleAuditService.submitAudit(
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, '图文审核提交成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  reviewSuspected = [
    validate(Joi.object({
      reviewLevel: Joi.number().integer().min(1).max(3).required(),
      auditRemark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const articleId = parseInt(req.params.articleId);
        const result = await ArticleAuditService.reviewSuspected(
          articleId,
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, '疑似违规发起复核成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  batchAction = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      action: Joi.string().valid('approve_low_risk', 'mark_overdue', 'review_suspected', 'reject').required(),
      auditRemark: Joi.string().allow(null, ''),
      rejectReasonCategory: Joi.string().allow(null, ''),
      rejectReasonDetail: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await ArticleAuditService.batchAction(
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, `批量操作完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    },
  ];

  exportLedger = [
    validate(Joi.object({
      articleIds: Joi.array().items(Joi.number().integer()).allow(null),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
      auditStatus: Joi.number().integer().allow(null, ''),
      auditorId: Joi.number().integer().allow(null, ''),
      articleType: Joi.number().integer().allow(null, ''),
      domainCategory: Joi.string().allow(null, ''),
      riskLevel: Joi.number().integer().allow(null, ''),
      action: Joi.string().allow(null, ''),
      rejectReasonCategory: Joi.string().allow(null, ''),
      rejectReasonDetail: Joi.string().allow(null, ''),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await ArticleAuditService.exportLedger(req.body);
        return success(res, result, '台账导出成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  getTraceRecord = [
    validate(Joi.object({
      auditBatch: Joi.string().allow(null, ''),
      riskTag: Joi.string().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ArticleAuditService.getTraceRecord(
          req.params.articleCode,
          { auditBatch: req.query.auditBatch, riskTag: req.query.riskTag }
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getQCReport = [
    validate(Joi.object({
      period: Joi.string().valid('today', 'week', 'month', 'custom').allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
      auditorId: Joi.number().integer().allow(null, ''),
      articleType: Joi.number().integer().allow(null, ''),
      domainCategory: Joi.string().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ArticleAuditService.getQCReport(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new ArticleAuditController();
