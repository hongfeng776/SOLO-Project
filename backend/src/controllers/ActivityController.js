const ActivityService = require('../services/ActivityService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class ActivityController {
  getList = [
    validate(paginationSchema.keys({
      type: Joi.number().integer().allow(null, ''),
      status: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await ActivityService.getActivityList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getById = [
    async (req, res, next) => {
      try {
        const result = await ActivityService.getActivityById(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  create = [
    validate(Joi.object({
      name: Joi.string().required().max(255),
      code: Joi.string().required().max(50),
      type: Joi.number().integer().required(),
      theme: Joi.string().allow(null, ''),
      image: Joi.string().allow(null, ''),
      banner: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      rules: Joi.string().allow(null, ''),
      startTime: Joi.date().required(),
      endTime: Joi.date().required(),
      signupStart: Joi.date().allow(null, ''),
      signupEnd: Joi.date().allow(null, ''),
      config: Joi.object().allow(null, ''),
      prizePool: Joi.array().allow(null, ''),
      totalBudget: Joi.number(),
      participantLimit: Joi.number().integer(),
      status: Joi.number().integer(),
      isHot: Joi.number().integer().valid(0, 1),
      isTop: Joi.number().integer().valid(0, 1),
      sortOrder: Joi.number().integer(),
      redirectUrl: Joi.string().allow(null, ''),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const id = await ActivityService.createActivity(req.body, req.user?.userId);
        return created(res, { id }, '活动创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  update = [
    validate(Joi.object({
      name: Joi.string().max(255),
      code: Joi.string().max(50),
      type: Joi.number().integer(),
      theme: Joi.string().allow(null, ''),
      image: Joi.string().allow(null, ''),
      banner: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      rules: Joi.string().allow(null, ''),
      startTime: Joi.date(),
      endTime: Joi.date(),
      signupStart: Joi.date().allow(null, ''),
      signupEnd: Joi.date().allow(null, ''),
      config: Joi.object().allow(null, ''),
      prizePool: Joi.array().allow(null, ''),
      totalBudget: Joi.number(),
      participantLimit: Joi.number().integer(),
      status: Joi.number().integer(),
      isHot: Joi.number().integer().valid(0, 1),
      isTop: Joi.number().integer().valid(0, 1),
      sortOrder: Joi.number().integer(),
      redirectUrl: Joi.string().allow(null, ''),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await ActivityService.updateActivity(parseInt(req.params.id), req.body, req.user?.userId);
        return success(res, null, '活动更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  delete = [
    async (req, res, next) => {
      try {
        await ActivityService.deleteActivity(parseInt(req.params.id));
        return success(res, null, '活动删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new ActivityController();
