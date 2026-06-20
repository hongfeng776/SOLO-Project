const MemberPrivilegeService = require('../services/MemberPrivilegeService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class MemberPrivilegeController {
  getPrivilegeList = [
    validate(paginationSchema.keys({
      privilegeType: Joi.string().allow(null, ''),
      status: Joi.number().integer().valid(1, 2, 3).allow(null, ''),
      scopeType: Joi.string().valid('ALL', 'NEW_USER').allow(null, ''),
      applicableLevel: Joi.string().allow(null, ''),
      configBatch: Joi.string().allow(null, ''),
      keyword: Joi.string().allow(null, ''),
      startTime: Joi.date().allow(null, ''),
      endTime: Joi.date().allow(null, ''),
      sortBy: Joi.string().valid('sortOrder', 'createdAt', 'updatedAt', 'effectiveStartTime').default('sortOrder'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberPrivilegeService.getPrivilegeList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getPrivilegeDetail = [
    async (req, res, next) => {
      try {
        const result = await MemberPrivilegeService.getPrivilegeDetail(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getPrivilegeStats = [
    async (req, res, next) => {
      try {
        const result = await MemberPrivilegeService.getPrivilegeStats();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkConflicts = [
    validate(Joi.object({
      privilegeName: Joi.string().allow(null, ''),
      privilegeType: Joi.string().allow(null, ''),
      applicableLevels: Joi.alternatives().try(Joi.array().items(Joi.number()), Joi.string()).allow(null),
      effectiveStartTime: Joi.date().allow(null, ''),
      effectiveEndTime: Joi.date().allow(null, ''),
      permissionSwitches: Joi.object().allow(null),
      excludeId: Joi.number().integer().allow(null),
    }), 'query'),
    async (req, res, next) => {
      try {
        const data = { ...req.query };
        if (typeof data.applicableLevels === 'string') {
          try { data.applicableLevels = JSON.parse(data.applicableLevels); } catch { data.applicableLevels = []; }
        }
        if (data.excludeId) data.excludeId = parseInt(data.excludeId);
        const result = await MemberPrivilegeService.checkConflicts(data, data.excludeId);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  createPrivilege = [
    validate(Joi.object({
      privilegeName: Joi.string().min(1).max(80).required(),
      privilegeType: Joi.string().valid(
        'WATCH_PRIVILEGE', 'AD_FREE', 'EXCLUSIVE_CONTENT', 'OFFLINE_DOWNLOAD',
        'COUPON', 'BADGE', 'PRIORITY', 'CUSTOMER_SERVICE', 'SCREEN_CAST', 'DOLBY', 'CUSTOM'
      ).required(),
      applicableLevels: Joi.array().items(Joi.number()).min(1).required(),
      effectiveStartTime: Joi.date().required(),
      effectiveEndTime: Joi.date().required(),
      usageLimit: Joi.number().integer().default(-1),
      dailyLimit: Joi.number().integer().default(-1),
      monthlyLimit: Joi.number().integer().default(-1),
      permissionSwitches: Joi.object().allow(null),
      usageRules: Joi.object().allow(null),
      scopeType: Joi.string().valid('ALL', 'NEW_USER').default('ALL'),
      sortOrder: Joi.number().integer().min(0).default(0),
      description: Joi.string().max(500).allow(null, ''),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberPrivilegeService.createPrivilege(req.body, operator);
        return created(res, result, '会员权益创建成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  updatePrivilege = [
    validate(Joi.object({
      privilegeName: Joi.string().min(1).max(80).allow(null, ''),
      privilegeType: Joi.string().valid(
        'WATCH_PRIVILEGE', 'AD_FREE', 'EXCLUSIVE_CONTENT', 'OFFLINE_DOWNLOAD',
        'COUPON', 'BADGE', 'PRIORITY', 'CUSTOMER_SERVICE', 'SCREEN_CAST', 'DOLBY', 'CUSTOM'
      ).allow(null, ''),
      applicableLevels: Joi.array().items(Joi.number()).allow(null),
      effectiveStartTime: Joi.date().allow(null),
      effectiveEndTime: Joi.date().allow(null),
      usageLimit: Joi.number().integer().allow(null),
      dailyLimit: Joi.number().integer().allow(null),
      monthlyLimit: Joi.number().integer().allow(null),
      permissionSwitches: Joi.object().allow(null),
      usageRules: Joi.object().allow(null),
      scopeType: Joi.string().valid('ALL', 'NEW_USER').allow(null, ''),
      sortOrder: Joi.number().integer().allow(null),
      description: Joi.string().max(500).allow(null, ''),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberPrivilegeService.updatePrivilege(
          parseInt(req.params.id),
          req.body,
          operator
        );
        return success(res, result, result.message || '会员权益更新成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  changeStatus = [
    validate(Joi.object({
      status: Joi.number().integer().valid(1, 2, 3).required(),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const statusLabelMap = { 1: '生效', 2: '暂停', 3: '下线' };
        const result = await MemberPrivilegeService.changeStatus(
          parseInt(req.params.id),
          req.body.status,
          operator
        );
        return success(res, result, `权益已切换为${statusLabelMap[req.body.status]}状态`);
      } catch (error) {
        next(error);
      }
    },
  ];

  getModifyHistory = [
    validate(paginationSchema.keys({
      modifyType: Joi.string().allow(null, ''),
      startTime: Joi.date().allow(null, ''),
      endTime: Joi.date().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberPrivilegeService.getModifyHistory(
          parseInt(req.params.privilegeId),
          req.query
        );
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  batchAction = [
    validate(Joi.object({
      action: Joi.string()
        .valid('batch_online', 'batch_pause', 'batch_limit_change')
        .required(),
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      usageLimit: Joi.number().integer().allow(null),
      dailyLimit: Joi.number().integer().allow(null),
      monthlyLimit: Joi.number().integer().allow(null),
      scopeType: Joi.string().valid('ALL', 'NEW_USER').allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const options = {};
        if (req.body.usageLimit !== undefined) options.usageLimit = req.body.usageLimit;
        if (req.body.dailyLimit !== undefined) options.dailyLimit = req.body.dailyLimit;
        if (req.body.monthlyLimit !== undefined) options.monthlyLimit = req.body.monthlyLimit;
        if (req.body.scopeType) options.scopeType = req.body.scopeType;

        const result = await MemberPrivilegeService.batchAction(
          req.body.action,
          req.body.ids,
          operator,
          options
        );
        const actionMap = {
          batch_online: '批量上线',
          batch_pause: '批量暂停',
          batch_limit_change: '批量修改上限',
        };
        return success(
          res,
          result,
          `${actionMap[req.body.action]}完成：成功${result.successCount}条，失败${result.failCount}条，跳过${result.skippedCount}条`
        );
      } catch (error) {
        next(error);
      }
    },
  ];

  getRedemptionRecords = [
    validate(paginationSchema.keys({
      privilegeId: Joi.number().integer().allow(null, ''),
      privilegeCode: Joi.string().allow(null, ''),
      userId: Joi.number().integer().allow(null, ''),
      uid: Joi.string().allow(null, ''),
      redemptionType: Joi.string().allow(null, ''),
      redemptionBatch: Joi.string().allow(null, ''),
      configBatch: Joi.string().allow(null, ''),
      privilegeType: Joi.string().allow(null, ''),
      startTime: Joi.date().allow(null, ''),
      endTime: Joi.date().allow(null, ''),
      sortBy: Joi.string().valid('createdAt', 'redemptionCount').default('createdAt'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberPrivilegeService.getRedemptionRecords(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getTraceInfo = [
    validate(Joi.object({
      traceType: Joi.string().valid('privilegeCode', 'configBatch', 'redemptionRecord').required(),
      traceValue: Joi.string().required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberPrivilegeService.getTraceInfo(
          req.query.traceType,
          req.query.traceValue
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new MemberPrivilegeController();
