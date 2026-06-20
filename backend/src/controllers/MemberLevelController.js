const MemberLevelService = require('../services/MemberLevelService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class MemberLevelController {
  getLevelList = [
    validate(paginationSchema.keys({
      levelTier: Joi.number().integer().allow(null, ''),
      isEnabled: Joi.number().integer().valid(0, 1).allow(null, ''),
      isCoreHighest: Joi.number().integer().valid(0, 1).allow(null, ''),
      configBatch: Joi.string().allow(null, ''),
      levelCode: Joi.string().allow(null, ''),
      keyword: Joi.string().allow(null, ''),
      startTime: Joi.date().allow(null, ''),
      endTime: Joi.date().allow(null, ''),
      sortBy: Joi.string().valid('levelTier', 'createdAt', 'updatedAt', 'minScore').default('levelTier'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberLevelService.getLevelList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getLevelDetail = [
    async (req, res, next) => {
      try {
        const result = await MemberLevelService.getLevelDetail(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getLevelStats = [
    async (req, res, next) => {
      try {
        const result = await MemberLevelService.getLevelStats();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkConflicts = [
    validate(Joi.object({
      levelCode: Joi.string().allow(null, ''),
      levelName: Joi.string().allow(null, ''),
      levelTier: Joi.number().integer().allow(null),
      minScore: Joi.number().integer().min(0).allow(null),
      maxScore: Joi.number().integer().allow(null),
      privileges: Joi.array().items(Joi.object()).allow(null),
      excludeId: Joi.number().integer().allow(null),
    }), 'query'),
    async (req, res, next) => {
      try {
        const data = {
          ...req.query,
          levelTier: req.query.levelTier ? parseInt(req.query.levelTier) : null,
          minScore: req.query.minScore ? parseInt(req.query.minScore) : null,
          maxScore: req.query.maxScore ? parseInt(req.query.maxScore) : null,
          excludeId: req.query.excludeId ? parseInt(req.query.excludeId) : null,
        };
        const result = await MemberLevelService.checkConflicts(data, data.excludeId);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  createLevel = [
    validate(Joi.object({
      levelName: Joi.string().min(1).max(50).required(),
      levelTier: Joi.number().integer().min(1).required(),
      minScore: Joi.number().integer().min(0).required(),
      maxScore: Joi.number().integer().required(),
      privileges: Joi.array().items(Joi.object({
        privilegeCode: Joi.string().required(),
        privilegeName: Joi.string().required(),
        privilegeValue: Joi.any().allow(null),
        privilegeDesc: Joi.string().allow(null, ''),
      })).default([]),
      upgradeConditions: Joi.object().allow(null),
      levelIcon: Joi.string().allow(null, ''),
      levelColor: Joi.string().allow(null, ''),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberLevelService.createLevel(req.body, operator);
        return created(res, result, '会员等级创建成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  updateLevel = [
    validate(Joi.object({
      levelName: Joi.string().min(1).max(50).allow(null, ''),
      levelTier: Joi.number().integer().min(1).allow(null),
      minScore: Joi.number().integer().min(0).allow(null),
      maxScore: Joi.number().integer().allow(null),
      privileges: Joi.array().items(Joi.object({
        privilegeCode: Joi.string().required(),
        privilegeName: Joi.string().required(),
        privilegeValue: Joi.any().allow(null),
        privilegeDesc: Joi.string().allow(null, ''),
      })).allow(null),
      upgradeConditions: Joi.object().allow(null),
      levelIcon: Joi.string().allow(null, ''),
      levelColor: Joi.string().allow(null, ''),
      remark: Joi.string().max(500).allow(null, ''),
      confirmed: Joi.boolean().default(false),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberLevelService.updateLevel(
          parseInt(req.params.id),
          req.body,
          operator
        );
        return success(res, result, result.message || '会员等级更新成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  enableLevel = [
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberLevelService.enableLevel(parseInt(req.params.id), operator);
        return success(res, result, '会员等级启用成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  disableLevel = [
    validate(Joi.object({
      confirmed: Joi.boolean().default(false),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberLevelService.disableLevel(
          parseInt(req.params.id),
          operator,
          req.body.confirmed
        );
        return success(res, result, '会员等级停用成功');
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
        const result = await MemberLevelService.getModifyHistory(
          parseInt(req.params.levelId),
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
        .valid('batch_enable', 'batch_disable', 'batch_sync_privileges')
        .required(),
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      sourceLevelId: Joi.number().integer().allow(null),
      confirmed: Joi.boolean().default(false),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberLevelService.batchAction(
          req.body.action,
          req.body.ids,
          operator,
          req.body.sourceLevelId,
          req.body.confirmed
        );
        const actionMap = {
          batch_enable: '批量启用',
          batch_disable: '批量停用',
          batch_sync_privileges: '批量同步权益',
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

  getUpgradeRecords = [
    validate(paginationSchema.keys({
      endUserId: Joi.number().integer().allow(null, ''),
      fromLevelTier: Joi.number().integer().allow(null, ''),
      toLevelTier: Joi.number().integer().allow(null, ''),
      levelCode: Joi.string().allow(null, ''),
      configBatch: Joi.string().allow(null, ''),
      operationBatch: Joi.string().allow(null, ''),
      upgradeType: Joi.string().allow(null, ''),
      startTime: Joi.date().allow(null, ''),
      endTime: Joi.date().allow(null, ''),
      sortBy: Joi.string().valid('createdAt', 'triggerScore').default('createdAt'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberLevelService.getUpgradeRecords(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getTraceInfo = [
    validate(Joi.object({
      traceType: Joi.string().valid('levelCode', 'configBatch', 'upgradeRecord').required(),
      traceValue: Joi.string().required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberLevelService.getTraceInfo(
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

module.exports = new MemberLevelController();
