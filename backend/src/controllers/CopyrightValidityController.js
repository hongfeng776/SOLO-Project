const CopyrightValidityService = require('../services/CopyrightValidityService');
const { success, paginated, created } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class CopyrightValidityController {
  getConfigList = [
    validate(paginationSchema.keys({
      enabled: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0')).allow(null, ''),
      thresholdUnit: Joi.number().integer().valid(1, 2, 3).allow(null, ''),
      expireHandlerRule: Joi.number().integer().valid(1, 2, 3, 4).allow(null, ''),
      relatedContentScope: Joi.number().integer().valid(1, 2, 3).allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.getConfigList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getConfigDetail = [
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.getConfigDetail(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  createConfig = [
    validate(Joi.object({
      configName: Joi.string().min(1).max(100).required(),
      enabled: Joi.boolean().default(true),
      warningThreshold: Joi.number().integer().min(1).default(30),
      thresholdUnit: Joi.number().integer().valid(1, 2, 3).default(1),
      expireHandlerRule: Joi.number().integer().valid(1, 2, 3, 4).default(1),
      relatedContentScope: Joi.number().integer().valid(1, 2, 3).default(1),
      pushChannels: Joi.array().items(Joi.string()).allow(null),
      receiverRoles: Joi.array().items(Joi.string()).allow(null),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.createConfig(
          req.body,
          req.user?.userId
        );
        return created(res, result, '有效期管控配置创建成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  updateConfig = [
    validate(Joi.object({
      configName: Joi.string().min(1).max(100).allow(null, ''),
      enabled: Joi.boolean().allow(null),
      warningThreshold: Joi.number().integer().min(1).allow(null),
      thresholdUnit: Joi.number().integer().valid(1, 2, 3).allow(null),
      expireHandlerRule: Joi.number().integer().valid(1, 2, 3, 4).allow(null),
      relatedContentScope: Joi.number().integer().valid(1, 2, 3).allow(null),
      pushChannels: Joi.array().items(Joi.string()).allow(null),
      receiverRoles: Joi.array().items(Joi.string()).allow(null),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.updateConfig(
          parseInt(req.params.id),
          req.body,
          req.user?.userId
        );
        return success(res, result, '有效期管控配置更新成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  deleteConfig = [
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.deleteConfig(parseInt(req.params.id));
        return success(res, result, '有效期管控配置删除成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  triggerScan = [
    validate(Joi.object({
      operatorId: Joi.number().integer().allow(null),
      operatorName: Joi.string().allow(null, ''),
      environmentMode: Joi.string().valid('test', 'prod').default('prod'),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.triggerFullScan(
          parseInt(req.params.id),
          req.body.operatorId || req.user?.userId,
          req.body.operatorName || req.user?.realName || req.user?.username,
          req.body
        );
        return success(res, result, `全量扫描触发完成：正常${result.stats.normal}条，预警${result.stats.warning}条，过期${result.stats.expired}条`);
      } catch (error) {
        next(error);
      }
    },
  ];

  getDashboardStats = [
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.getDashboardStats();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  changeStatus = [
    validate(Joi.object({
      targetStatus: Joi.number().integer().valid(1, 2, 3).required(),
      configId: Joi.number().integer().allow(null),
      operatorId: Joi.number().integer().allow(null),
      operatorName: Joi.string().allow(null, ''),
      environmentMode: Joi.string().valid('test', 'prod').default('prod'),
      batchNo: Joi.string().allow(null, ''),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.changeValidityStatus(
          req.body.configId || (await CopyrightValidityService.getConfigList({ page: 1, pageSize: 1, enabled: true })).list[0]?.id,
          parseInt(req.params.id),
          req.body.targetStatus,
          req.body.operatorId || req.user?.userId,
          req.body.operatorName || req.user?.realName || req.user?.username,
          req.body
        );
        return success(res, result, `状态变更成功：${result.fromStatusLabel} → ${result.toStatusLabel}`);
      } catch (error) {
        next(error);
      }
    },
  ];

  getStatusHistory = [
    validate(paginationSchema.keys({
      configId: Joi.number().integer().allow(null, ''),
      eventType: Joi.string().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.getStatusHistory(
          parseInt(req.params.id),
          req.query
        );
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  batchExecute = [
    validate(Joi.object({
      taskType: Joi.string().valid('RENEW_WARNING', 'REMOVE', 'ARCHIVE').required(),
      copyrightIds: Joi.array().items(Joi.number().integer()).min(1).required(),
      configId: Joi.number().integer().allow(null),
      environmentMode: Joi.string().valid('test', 'prod').default('prod'),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.batchExecuteAction(
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, `批量任务已提交：成功${result.successCount}条，失败${result.failedCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    },
  ];

  getTaskList = [
    validate(paginationSchema.keys({
      taskType: Joi.string().allow(null, ''),
      status: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
      environmentMode: Joi.string().allow(null, ''),
      configId: Joi.number().integer().allow(null, ''),
      operatorId: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.getTaskList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getTaskDetail = [
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.getTaskDetail(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  traceEvents = [
    validate(paginationSchema.keys({
      configId: Joi.number().integer().allow(null, ''),
      copyrightId: Joi.number().integer().allow(null, ''),
      copyrightCode: Joi.string().allow(null, ''),
      validityStatus: Joi.number().integer().valid(1, 2, 3).allow(null, ''),
      eventType: Joi.string().allow(null, ''),
      batchNo: Joi.string().allow(null, ''),
      operatorId: Joi.number().integer().allow(null, ''),
      startTime: Joi.date().allow(null, ''),
      endTime: Joi.date().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.traceValidityFlow(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  traceExceptions = [
    validate(paginationSchema.keys({
      configId: Joi.number().integer().allow(null, ''),
      exceptionType: Joi.string().allow(null, ''),
      startTime: Joi.date().allow(null, ''),
      endTime: Joi.date().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.getTraceExceptions(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkIntegrity = [
    validate(Joi.object({
      configId: Joi.number().integer().allow(null),
      autoFix: Joi.boolean().default(false),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.checkExecutionIntegrity(
          req.body.configId,
          req.body
        );
        return success(res, result, `执行完整性校验完成：问题${result.totalIssues}处，警告${result.totalWarnings}处，评分${result.integrityScore}(${result.grade})`);
      } catch (error) {
        next(error);
      }
    },
  ];

  handleWarning = [
    validate(Joi.object({
      action: Joi.string().valid('mark_renewed', 'mark_handled', 'escalate').required(),
      newEndDate: Joi.date().when('action', { is: 'mark_renewed', then: Joi.required(), otherwise: Joi.allow(null) }),
      remark: Joi.string().max(500).allow(null, ''),
      escalateTo: Joi.string().when('action', { is: 'escalate', then: Joi.required(), otherwise: Joi.allow(null) }),
      environmentMode: Joi.string().valid('test', 'prod').default('prod'),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightValidityService.handleWarning(
          parseInt(req.params.id),
          req.body,
          req.user?.userId,
          req.user?.realName || req.user?.username
        );
        return success(res, result, `预警处理完成：${result.action}`);
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new CopyrightValidityController();
