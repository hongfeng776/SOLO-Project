const CommentAuditService = require('../services/CommentAuditService');
const { success, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

const VIOLATION_TYPES = [
  'political_sensitive',
  'pornographic_content',
  'violent_content',
  'drug_contraband',
  'gambling_content',
  'personal_attack',
  'abuse_insult',
  'spam_advertisement',
  'fraud_scam',
  'false_information',
  'copyright_infringement',
  'other_violation',
];

const AUDIT_ACTIONS = ['approve', 'hide', 'delete', 'mute'];
const BATCH_ACTIONS = ['clean_history', 'approve_compliant', 'mark_suspected'];
const PERIODS = ['today', 'week', 'month', 'custom'];

class CommentAuditController {
  getAuditPool = [
    validate(paginationSchema.keys({
      auditStatus: Joi.number().integer().min(0).max(4).allow(null, ''),
      contentId: Joi.number().integer().allow(null, ''),
      userId: Joi.number().integer().allow(null, ''),
      violationLevel: Joi.number().integer().min(0).max(3).allow(null, ''),
      violationType: Joi.string().valid(...VIOLATION_TYPES).allow(null, ''),
      source: Joi.string().valid('new_published', 'user_reported', 'history_violation', 'high_risk_auto').allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.getAuditPool(
          req.query,
          req.user?.userId,
          req.user?.roleCode
        );
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getDetail = [
    validate(Joi.object({
      commentId: Joi.number().integer().required(),
    }), 'params'),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.getDetail(parseInt(req.params.commentId));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkDuplicate = [
    validate(Joi.object({
      commentId: Joi.number().integer().required(),
    }), 'params'),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.checkDuplicate(parseInt(req.params.commentId));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  submitAudit = [
    validate(Joi.object({
      commentId: Joi.number().integer().required(),
      action: Joi.string().valid(...AUDIT_ACTIONS).required(),
      violationType: Joi.string().valid(...VIOLATION_TYPES).allow(null, ''),
      violationRemark: Joi.string().max(500).allow(null, ''),
      muteDays: Joi.number().integer().min(1).max(365).allow(null),
    })),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.submitAudit(
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, '评论审核提交成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  batchAction = [
    validate(Joi.object({
      action: Joi.string().valid(...BATCH_ACTIONS).required(),
      violationType: Joi.string().valid(...VIOLATION_TYPES).allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
      contentIds: Joi.array().items(Joi.number().integer()).allow(null),
      commentIds: Joi.array().items(Joi.number().integer()).allow(null),
      timeRange: Joi.array().items(Joi.date()).length(2).allow(null),
    })),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.batchAction(
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, `批量操作完成：成功${result.success}条，失败${result.failed}条，跳过${result.skipped}条`);
      } catch (error) {
        next(error);
      }
    },
  ];

  getBatchProgress = [
    validate(Joi.object({
      batchId: Joi.string().pattern(/^CB_\d{10,}\d{6}$/).required().messages({
        'string.pattern.base': 'batchId格式错误，应为CB_+Unix时间戳+6位随机',
      }),
    }), 'params'),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.getBatchProgress(req.params.batchId);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  refreshPartial = [
    validate(Joi.object({
      commentIds: Joi.array().items(Joi.number().integer()).min(1).max(100).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.refreshPartial(req.body.commentIds);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getTraceRecord = [
    validate(Joi.object({
      commentId: Joi.number().integer().required(),
    }), 'params'),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.getTraceRecord(parseInt(req.params.commentId));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getQCReport = [
    validate(Joi.object({
      period: Joi.string().valid(...PERIODS).allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
      auditorId: Joi.number().integer().allow(null, ''),
      violationType: Joi.string().valid(...VIOLATION_TYPES).allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.getQCReport(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkPunishment = [
    validate(Joi.object({
      violationType: Joi.string().valid(...VIOLATION_TYPES).required(),
      action: Joi.string().valid(...AUDIT_ACTIONS).allow(null, ''),
      muteDays: Joi.number().integer().min(1).max(365).allow(null),
    })),
    async (req, res, next) => {
      try {
        const result = await CommentAuditService.checkPunishmentConsistency(
          req.body.violationType,
          req.body.action,
          req.body.muteDays
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getConstants = [
    async (req, res, next) => {
      try {
        const result = CommentAuditService.getAuditConstants();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new CommentAuditController();
