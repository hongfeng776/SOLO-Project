const Joi = require('joi');
const UserFeedbackService = require('../services/UserFeedbackService');
const { success } = require('../utils/helpers');
const ValidationError = require('../errors/ValidationError');

const _extractOperator = (ctx) => {
  const user = ctx.state.user || {};
  return {
    id: user.id, name: user.name || user.username, username: user.username,
    isSuperAdmin: (user.roles || []).includes('SUPER_ADMIN'),
  };
};

const schemas = {
  createFeedback: Joi.object({
    userId: Joi.number().integer().required(),
    uid: Joi.string().required(),
    feedbackType: Joi.string().valid('BUG', 'SUGGESTION', 'COMPLAINT').required(),
    title: Joi.string().min(2).max(200).required(),
    content: Joi.string().min(5).required(),
    attachments: Joi.array().items(Joi.object()).optional(),
    source: Joi.string().valid('APP', 'WEB', 'EMAIL', 'PHONE').optional(),
    priority: Joi.number().integer().valid(1, 2, 3, 4).optional(),
    category: Joi.string().max(50).optional(),
    tags: Joi.object().optional(),
  }),

  resolveFeedback: Joi.object({
    resolution: Joi.string().min(10).max(2000).required(),
    result: Joi.string().max(500).required(),
  }),

  rejectFeedback: Joi.object({
    rejectReason: Joi.string().min(5).max(500).required(),
  }),

  batchAction: Joi.object({
    action: Joi.string().valid('ARCHIVE', 'URGENT', 'CLOSE').required(),
    ids: Joi.array().items(Joi.number().integer()).min(1).max(200).required(),
    filters: Joi.object({
      feedbackType: Joi.string().valid('BUG', 'SUGGESTION', 'COMPLAINT'),
      status: Joi.number().integer().valid(1, 2, 3, 4),
    }).optional(),
  }),
};

class UserFeedbackController {

  static async getStats(ctx) {
    const stats = await UserFeedbackService.getFeedbackStats();
    ctx.body = success(stats);
  }

  static async getList(ctx) {
    const params = ctx.query;
    const result = await UserFeedbackService.getFeedbackList(params);
    ctx.body = success(result);
  }

  static async getDetail(ctx) {
    const result = await UserFeedbackService.getFeedbackDetail(Number(ctx.params.id));
    ctx.body = success(result);
  }

  static async create(ctx) {
    const { error, value } = schemas.createFeedback.validate(ctx.request.body);
    if (error) throw new ValidationError(error.details[0].message);
    const operator = _extractOperator(ctx);
    const result = await UserFeedbackService.createFeedback(value, operator);
    ctx.body = success(result);
  }

  static async assign(ctx) {
    const operator = _extractOperator(ctx);
    const result = await UserFeedbackService.assignFeedback(Number(ctx.params.id), operator);
    ctx.body = success(result);
  }

  static async startProcessing(ctx) {
    const operator = _extractOperator(ctx);
    const result = await UserFeedbackService.startProcessing(Number(ctx.params.id), operator);
    ctx.body = success(result);
  }

  static async resolve(ctx) {
    const { error, value } = schemas.resolveFeedback.validate(ctx.request.body);
    if (error) throw new ValidationError(error.details[0].message);
    const operator = _extractOperator(ctx);
    const result = await UserFeedbackService.resolveFeedback(Number(ctx.params.id), value, operator);
    ctx.body = success(result);
  }

  static async reject(ctx) {
    const { error, value } = schemas.rejectFeedback.validate(ctx.request.body);
    if (error) throw new ValidationError(error.details[0].message);
    const operator = _extractOperator(ctx);
    const result = await UserFeedbackService.rejectFeedback(Number(ctx.params.id), value, operator);
    ctx.body = success(result);
  }

  static async batchAction(ctx) {
    const { error, value } = schemas.batchAction.validate(ctx.request.body);
    if (error) throw new ValidationError(error.details[0].message);
    const operator = _extractOperator(ctx);
    const result = await UserFeedbackService.batchAction(value, operator);
    ctx.body = success(result);
  }

  static async trace(ctx) {
    const query = ctx.query;
    const result = await UserFeedbackService.traceFeedback(query);
    ctx.body = success(result);
  }

  static async validate(ctx) {
    const result = await UserFeedbackService.validateFeedbackIntegrity(Number(ctx.params.id));
    ctx.body = success(result);
  }

  static async checkDuplicate(ctx) {
    const { userId, title, feedbackType } = ctx.query;
    const result = await UserFeedbackService.checkDuplicateSubmission(Number(userId), title, feedbackType);
    ctx.body = success(result);
  }

  static async upgradePriority(ctx) {
    const result = await UserFeedbackService.checkAndUpgradePriority();
    ctx.body = success(result);
  }

  static async updateTimeliness(ctx) {
    const result = await UserFeedbackService.updateTimeliness();
    ctx.body = success(result);
  }
}

module.exports = UserFeedbackController;
