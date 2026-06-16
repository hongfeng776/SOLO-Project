const MemberService = require('../services/MemberService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class MemberController {
  getMemberList = [
    validate(paginationSchema.keys({
      level: Joi.number().integer().allow(null, ''),
      status: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberService.getMemberList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getMemberById = [
    async (req, res, next) => {
      try {
        const result = await MemberService.getMemberById(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  createMember = [
    validate(Joi.object({
      userId: Joi.number().integer().required(),
      level: Joi.number().integer().required(),
      duration: Joi.number().integer().required(),
      paymentMethod: Joi.string().allow(null, ''),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const id = await MemberService.createMember(req.body);
        return created(res, { id }, '会员创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  updateMember = [
    validate(Joi.object({
      level: Joi.number().integer(),
      status: Joi.number().integer(),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await MemberService.updateMember(parseInt(req.params.id), req.body);
        return success(res, null, '会员更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  renewMember = [
    validate(Joi.object({
      duration: Joi.number().integer().required(),
      paymentMethod: Joi.string().allow(null, ''),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await MemberService.renewMember(parseInt(req.params.id), req.body);
        return success(res, null, '会员续费成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  upgradeMember = [
    validate(Joi.object({
      level: Joi.number().integer().required(),
      paymentMethod: Joi.string().allow(null, ''),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await MemberService.upgradeMember(parseInt(req.params.id), req.body);
        return success(res, null, '会员升级成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  freezeMember = [
    async (req, res, next) => {
      try {
        await MemberService.freezeMember(parseInt(req.params.id));
        return success(res, null, '会员冻结成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  unfreezeMember = [
    async (req, res, next) => {
      try {
        await MemberService.unfreezeMember(parseInt(req.params.id));
        return success(res, null, '会员解冻成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  getMemberStats = [
    async (req, res, next) => {
      try {
        const result = await MemberService.getMemberStats();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new MemberController();
