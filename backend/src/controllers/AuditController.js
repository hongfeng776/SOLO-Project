const AuditService = require('../services/AuditService');
const { success, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class AuditController {
  getAuditDetail = [
    async (req, res, next) => {
      try {
        const result = await AuditService.getAuditDetail(parseInt(req.params.contentId));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  previewAssign = [
    async (req, res, next) => {
      try {
        const result = await AuditService.previewAssign(parseInt(req.params.contentId));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkDuplicate = [
    async (req, res, next) => {
      try {
        const result = await AuditService.checkDuplicate(parseInt(req.params.contentId));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  validateOperation = [
    validate(Joi.object({
      contentId: Joi.number().integer().required(),
      auditStatus: Joi.number().integer().required(),
      reviewLevel: Joi.number().integer().min(1).max(3),
    })),
    async (req, res, next) => {
      try {
        const result = await AuditService.validateOperation(req.body);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  submitAudit = [
    validate(Joi.object({
      contentId: Joi.number().integer().required(),
      auditStatus: Joi.number().integer().required(),
      auditRemark: Joi.string().allow(null, ''),
      rejectReasonCategory: Joi.string().allow(null, ''),
      rejectReasonDetail: Joi.string().allow(null, ''),
      reviewLevel: Joi.number().integer().min(1).max(3),
      nextReviewerId: Joi.number().integer().allow(null),
    })),
    async (req, res, next) => {
      try {
        const result = await AuditService.submitAudit(
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, '审核提交成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  batchAction = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      action: Joi.string().valid('approve', 'reject', 'pending', 'urgent', 'archive').required(),
      auditStatus: Joi.number().integer(),
      auditRemark: Joi.string().allow(null, ''),
      rejectReasonCategory: Joi.string().allow(null, ''),
      rejectReasonDetail: Joi.string().allow(null, ''),
      priority: Joi.number().integer(),
    })),
    async (req, res, next) => {
      try {
        const userRole = req.user?.role || 'CONTENT_AUDITOR';
        const result = await AuditService.batchAction(
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username,
          userRole
        );
        return success(res, result, `批量操作完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    },
  ];

  getTaskPool = [
    validate(paginationSchema.keys({
      auditStatus: Joi.number().integer().allow(null, ''),
      category: Joi.number().integer().allow(null, ''),
      priority: Joi.number().integer().allow(null, ''),
      riskLevel: Joi.number().integer().allow(null, ''),
      assignedTo: Joi.number().integer().allow(null, ''),
      isArchived: Joi.boolean().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await AuditService.getTaskPool(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getAuditTrace = [
    validate(Joi.object({
      auditNo: Joi.string().allow(null, ''),
      contentId: Joi.number().integer().allow(null, ''),
      auditorId: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await AuditService.getAuditTrace(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getQualityReport = [
    validate(Joi.object({
      period: Joi.string().valid('today', 'week', 'month', 'custom').allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
      auditorId: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await AuditService.getQualityReport(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getAssignRules = [
    async (req, res, next) => {
      try {
        const result = AuditService.getAssignRules();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getRejectReasons = [
    async (req, res, next) => {
      try {
        const result = AuditService.getRejectReasonTemplates();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  refreshPartial = [
    validate(Joi.object({
      contentIds: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await AuditService.refreshPartial(req.body.contentIds);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new AuditController();
