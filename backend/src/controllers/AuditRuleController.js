const AuditRuleService = require('../services/AuditRuleService');
const { success, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class AuditRuleController {
  getList = [
    validate(paginationSchema.keys({
      ruleType: Joi.string().allow(null, ''),
      ruleCategory: Joi.string().allow(null, ''),
      ruleStatus: Joi.number().integer().allow(null, ''),
      isCoreDefault: Joi.string().allow(null, ''),
      priorityMin: Joi.number().integer().allow(null, ''),
      priorityMax: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.getList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getDetail = [
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.getDetail(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  createRule = [
    validate(Joi.object({
      ruleName: Joi.string().min(1).max(100).required(),
      ruleType: Joi.string().valid('content', 'comment', 'image', 'video', 'user', 'keyword', 'score').required(),
      ruleCategory: Joi.string().allow(null, ''),
      ruleDescription: Joi.string().max(500).allow(null, ''),
      applicableCategory: Joi.array().items(Joi.string()).allow(null),
      applicableRiskLevels: Joi.array().items(Joi.number().integer()).allow(null),
      effectiveStartTime: Joi.date().allow(null, ''),
      effectiveEndTime: Joi.date().allow(null, ''),
      priority: Joi.number().integer().min(0).max(100).default(50),
      triggerConditions: Joi.object().allow(null),
      actions: Joi.array().items(Joi.object()).allow(null),
      ruleParams: Joi.object().allow(null),
      sortOrder: Joi.number().integer().default(0),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.createRule(
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, '规则创建成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  updateRule = [
    validate(Joi.object({
      ruleName: Joi.string().min(1).max(100).allow(null, ''),
      ruleCategory: Joi.string().allow(null, ''),
      ruleDescription: Joi.string().max(500).allow(null, ''),
      applicableCategory: Joi.array().items(Joi.string()).allow(null),
      applicableRiskLevels: Joi.array().items(Joi.number().integer()).allow(null),
      effectiveStartTime: Joi.date().allow(null, ''),
      effectiveEndTime: Joi.date().allow(null, ''),
      priority: Joi.number().integer().min(0).max(100).allow(null),
      triggerConditions: Joi.object().allow(null),
      actions: Joi.array().items(Joi.object()).allow(null),
      ruleParams: Joi.object().allow(null),
      sortOrder: Joi.number().integer().allow(null),
      ruleStatus: Joi.number().integer().allow(null),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.updateRule(
          parseInt(req.params.id),
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, '规则更新成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  enableRule = [
    validate(Joi.object({
      resetEffectiveTime: Joi.boolean().default(false),
    })),
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.enableRule(
          parseInt(req.params.id),
          req.body
        );
        return success(res, result, '规则启用成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  disableRule = [
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.disableRule(parseInt(req.params.id));
        return success(res, result, '规则停用成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  deleteRule = [
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.deleteRule(parseInt(req.params.id));
        return success(res, result, '规则删除成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  checkConflicts = [
    validate(Joi.object({
      ruleType: Joi.string().valid('content', 'comment', 'image', 'video', 'user', 'keyword', 'score').required(),
      ruleCategory: Joi.string().allow(null, ''),
      applicableCategory: Joi.array().items(Joi.string()).allow(null),
      applicableRiskLevels: Joi.array().items(Joi.number().integer()).allow(null),
      effectiveStartTime: Joi.date().allow(null, ''),
      effectiveEndTime: Joi.date().allow(null, ''),
      triggerConditions: Joi.object().allow(null),
      actions: Joi.array().items(Joi.object()).allow(null),
      ruleParams: Joi.object().allow(null),
      excludeId: Joi.number().integer().allow(null),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.checkConflicts(
          req.query,
          req.query.excludeId ? parseInt(req.query.excludeId) : null
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkConsistency = [
    validate(Joi.object({
      ruleType: Joi.string().allow(null, ''),
      ruleCategory: Joi.string().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.checkConsistency(
          req.query.ruleType,
          req.query.ruleCategory
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  batchAction = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      action: Joi.string().valid('enable', 'disable', 'sync', 'delete', 'export').required(),
      resetEffectiveTime: Joi.boolean().allow(null),
      targetCategories: Joi.array().items(Joi.string()).allow(null),
    })),
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.batchAction(
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, `批量操作完成：成功${result.successCount}条，失败${result.failCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    },
  ];

  getTraceRecord = [
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.getTraceRecord(req.params.ruleCode);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getModifyHistory = [
    validate(paginationSchema.keys({}), 'query'),
    async (req, res, next) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const result = await AuditRuleService.getModifyHistory(
          parseInt(req.params.ruleId),
          page,
          pageSize
        );
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getDynamicFields = [
    validate(Joi.object({
      ruleType: Joi.string().valid('content', 'comment', 'image', 'video', 'user', 'keyword', 'score').required(),
      ruleCategory: Joi.string().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = AuditRuleService.getDynamicFields(
          req.query.ruleType,
          req.query.ruleCategory
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  exportRules = [
    validate(Joi.object({
      ruleIds: Joi.array().items(Joi.number().integer()).allow(null),
    })),
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.exportRules(req.body.ruleIds);
        return success(res, result, '规则导出成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  getCoreDefaultRules = [
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.getCoreDefaultRules();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  syncRule = [
    validate(Joi.object({
      targetCategories: Joi.array().items(Joi.string()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await AuditRuleService.syncRuleToCategories(
          parseInt(req.params.id),
          req.body.targetCategories,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, '规则同步成功');
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new AuditRuleController();
