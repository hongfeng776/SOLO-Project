const Joi = require('joi');
const UserSegmentService = require('../services/UserSegmentService');
const { success, withTransaction } = require('../utils/helpers');
const ValidationError = require('../errors/ValidationError');

const _extractOperator = (ctx) => {
  const user = ctx.state.user || {};
  return {
    id: user.id, name: user.name || user.username, username: user.username,
    isSuperAdmin: (user.roles || []).includes('SUPER_ADMIN'),
  };
};

const schemas = {
  ruleCreate: Joi.object({
    ruleName: Joi.string().min(2).max(100).required(),
    ruleCode: Joi.string().max(50),
    description: Joi.string().max(500),
    dimension: Joi.string().valid('PLAY', 'INTERACTION', 'CONSUMPTION', 'PUBLISH', 'COMPOSITE').required(),
    thresholds: Joi.array().items(Joi.object({
      level: Joi.number().integer().min(1).max(5).required(),
      min: Joi.number().min(0).allow(null),
      max: Joi.number().min(0).allow(null),
    })).min(2).required(),
    weights: Joi.object().pattern(/^/, Joi.number().min(0).max(1)).optional(),
    targetUserType: Joi.array().items(Joi.number()).optional(),
    targetMinLevel: Joi.number().integer().min(0).optional(),
    autoCalcEnabled: Joi.number().valid(0, 1).optional(),
    status: Joi.number().valid(1, 2, 3, 4).optional(),
    effectiveStartAt: Joi.date().optional(),
    effectiveEndAt: Joi.date().optional(),
    priority: Joi.number().integer().optional(),
    tagTemplate: Joi.object().optional(),
  }),

  strategyCreate: Joi.object({
    strategyName: Joi.string().min(2).max(100).required(),
    strategyCode: Joi.string().max(50).optional(),
    strategyType: Joi.string().valid('BENEFIT', 'PUSH', 'WELFARE', 'GUIDE').required(),
    description: Joi.string().max(500).optional(),
    targetLevels: Joi.array().items(Joi.number().min(1).max(5)).min(1).required(),
    targetMinActivity: Joi.array().items(Joi.number()).optional(),
    targetUserType: Joi.array().items(Joi.number()).optional(),
    targetMinConsumption: Joi.number().optional(),
    targetUserIds: Joi.array().items(Joi.number()).optional(),
    benefitConfig: Joi.object().optional(),
    pushConfig: Joi.object().optional(),
    welfareConfig: Joi.object().optional(),
    guideConfig: Joi.object().optional(),
    triggerMode: Joi.number().valid(1, 2, 3).optional(),
    triggerTime: Joi.date().optional(),
    recurringCron: Joi.string().optional(),
  }),

  manualAdjust: Joi.object({
    userId: Joi.number().required(),
    toLevel: Joi.number().integer().min(1).max(5).required(),
    reason: Joi.string().min(5).max(500).required(),
    remark: Joi.string().max(1000).optional(),
    expireDays: Joi.number().integer().min(1).max(3650).optional(),
  }),
};

class UserSegmentController {
  static async getStats(ctx) {
    const data = await UserSegmentService.getStats();
    success(ctx, data);
  }

  // ============ 规则管理 ============
  static async getRuleList(ctx) {
    const data = await UserSegmentService.getRuleList(ctx.query);
    success(ctx, data);
  }

  static async getRuleDetail(ctx) {
    const id = Number(ctx.params.id);
    const list = await UserSegmentService.getRuleList({ page: 1, pageSize: 1 });
    const rule = list.list[0];
    if (!rule) throw new ValidationError('规则不存在');
    success(ctx, rule);
  }

  static async createRule(ctx) {
    const payload = schemas.ruleCreate.validateAsync(ctx.request.body);
    if (payload.error) throw new ValidationError(payload.error.message);
    const data = await withTransaction(async () => UserSegmentService.createRule(await payload, _extractOperator(ctx)));
    success(ctx, data, '规则创建成功');
  }

  static async updateRule(ctx) {
    const id = Number(ctx.params.id);
    const payload = await schemas.ruleCreate.fork(['ruleName', 'dimension', 'thresholds'], (s) => s.optional()).validateAsync(ctx.request.body);
    if (payload.error) throw new ValidationError(payload.error.message);
    const data = await UserSegmentService.updateRule(id, payload, _extractOperator(ctx));
    success(ctx, data, '规则更新成功');
  }

  static async deleteRule(ctx) {
    const { UserSegmentRule } = require('../models');
    const id = Number(ctx.params.id);
    await UserSegmentRule.destroy({ where: { id } });
    success(ctx, null, '规则删除成功');
  }

  static async updateRuleStatus(ctx) {
    const id = Number(ctx.params.id);
    const { status } = ctx.request.body;
    const data = await UserSegmentService.updateRule(id, { status }, _extractOperator(ctx));
    success(ctx, data, '状态更新成功');
  }

  static async runRuleCalc(ctx) {
    const id = Number(ctx.params.id);
    const res = await UserSegmentService.batchUpdateUserTags(id, { operator: _extractOperator(ctx), type: 'RULE_CHANGE' });
    success(ctx, res, `计算任务已启动，批次号：${res.operationBatch}`);
  }

  // ============ 规则校验 ============
  static async validateThresholds(ctx) {
    try {
      const { thresholds, weights } = ctx.request.body;
      UserSegmentService.validateThresholds(thresholds || []);
      if (weights) UserSegmentService.validateWeights(weights);
      success(ctx, { valid: true }, '阈值与权重校验通过');
    } catch (e) {
      success(ctx, { valid: false, reason: e.message }, '校验未通过');
    }
  }

  // ============ 用户分层标签 ============
  static async getTagList(ctx) {
    const data = await UserSegmentService.getSegmentTagList(ctx.query);
    success(ctx, data);
  }

  // ============ 层级调整 ============
  static async manualAdjust(ctx) {
    const payload = await schemas.manualAdjust.validateAsync(ctx.request.body);
    if (payload.error) throw new ValidationError(payload.error.message);
    const { userId, toLevel, reason, remark, expireDays } = payload;
    const data = await UserSegmentService.manualAdjust(userId, toLevel, reason, remark, _extractOperator(ctx), expireDays);
    success(ctx, data, '层级调整完成');
  }

  // ============ 策略管理 ============
  static async getStrategyList(ctx) {
    const data = await UserSegmentService.getStrategyList(ctx.query);
    success(ctx, data);
  }

  static async createStrategy(ctx) {
    const payload = await schemas.strategyCreate.validateAsync(ctx.request.body);
    if (payload.error) throw new ValidationError(payload.error.message);
    const data = await UserSegmentService.createStrategy(payload, _extractOperator(ctx));
    success(ctx, data, '策略创建成功');
  }

  static async getStrategyMatchPreview(ctx) {
    const data = await UserSegmentService.getStrategyMatchPreview(Number(ctx.params.id));
    success(ctx, data);
  }

  static async cancelStrategy(ctx) {
    const { SegmentStrategy, STRATEGY_STATUS } = require('../models');
    const id = Number(ctx.params.id);
    await SegmentStrategy.update({ status: STRATEGY_STATUS.CANCELLED.value }, { where: { id } });
    success(ctx, null, '策略已取消');
  }

  // ============ 溯源与校验 ============
  static async traceSegment(ctx) {
    const userId = Number(ctx.params.userId || ctx.query.userId);
    if (!userId) throw new ValidationError('请指定用户ID');
    const data = await UserSegmentService.traceSegment(userId);
    success(ctx, data);
  }

  static async validateMatch(ctx) {
    const ruleId = Number(ctx.params.ruleId || ctx.query.ruleId);
    if (!ruleId) throw new ValidationError('请指定规则ID');
    const data = await UserSegmentService.validateSegmentMatch(ruleId);
    success(ctx, data);
  }

  static async checkBenefitFit(ctx) {
    const { level, benefitConfig } = ctx.request.body;
    if (!level || !benefitConfig) throw new ValidationError('参数不完整');
    const data = await UserSegmentService.checkBenefitFit(level, benefitConfig);
    success(ctx, data);
  }
}

module.exports = UserSegmentController;
