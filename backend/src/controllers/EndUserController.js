const EndUserService = require('../services/EndUserService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class EndUserController {
  getList = [
    validate(paginationSchema.keys({
      userType: Joi.number().integer().valid(1, 2, 3).allow(null, ''),
      accountStatus: Joi.number().integer().valid(1, 2, 3, 4, 5).allow(null, ''),
      creatorLevel: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
      memberLevel: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
      activityLevel: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
      isVerified: Joi.number().integer().valid(0, 1).allow(null, ''),
      minViolationCount: Joi.number().integer().min(0).allow(null, ''),
      maxViolationCount: Joi.number().integer().min(0).allow(null, ''),
      registerStartDate: Joi.string().allow(null, ''),
      registerEndDate: Joi.string().allow(null, ''),
      operationBatch: Joi.string().allow(null, ''),
      userTag: Joi.string().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await EndUserService.getUserList(req.query);
        return paginated(res, result);
      } catch (e) { next(e); }
    }
  ];

  getById = [
    async (req, res, next) => {
      try {
        const result = await EndUserService.getUserById(parseInt(req.params.id));
        return success(res, result);
      } catch (e) { next(e); }
    }
  ];

  getByUid = [
    async (req, res, next) => {
      try {
        const result = await EndUserService.getUserByUid(req.params.uid);
        return success(res, result);
      } catch (e) { next(e); }
    }
  ];

  create = [
    validate(Joi.object({
      username: Joi.string().min(3).max(50).allow(null, ''),
      password: Joi.string().min(6).max(50).allow(null, ''),
      nickname: Joi.string().max(50).allow(null, ''),
      realName: Joi.string().max(50).allow(null, ''),
      idCardNo: Joi.string().max(32).allow(null, ''),
      avatar: Joi.string().max(500).allow(null, ''),
      email: Joi.string().email().allow(null, ''),
      phone: Joi.string().max(20).allow(null, ''),
      gender: Joi.number().integer().valid(0, 1, 2),
      birthday: Joi.string().allow(null, ''),
      region: Joi.string().max(100).allow(null, ''),
      signature: Joi.string().max(200).allow(null, ''),
      userType: Joi.number().integer().valid(1, 2, 3),
      creatorLevel: Joi.number().integer().valid(0, 1, 2, 3, 4),
      memberLevel: Joi.number().integer().valid(0, 1, 2, 3, 4),
      userTags: Joi.array(),
      riskTags: Joi.array(),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const duplicateCheck = await EndUserService.validateDuplicate({ ...req.body, checkType: 'CREATE' });
        if (duplicateCheck.isDuplicate) {
          return res.status(409).json({
            code: 409,
            message: `${duplicateCheck.type === 'USERNAME' ? '用户名' : '手机号'}已存在`,
            data: duplicateCheck,
          });
        }
        const result = await EndUserService.createUser(req.body, req.user?.userId);
        return created(res, result, '用户创建成功');
      } catch (e) { next(e); }
    }
  ];

  update = [
    validate(Joi.object({
      nickname: Joi.string().max(50).allow(null, ''),
      realName: Joi.string().max(50).allow(null, ''),
      idCardNo: Joi.string().max(32).allow(null, ''),
      avatar: Joi.string().max(500).allow(null, ''),
      email: Joi.string().email().allow(null, ''),
      phone: Joi.string().max(20).allow(null, ''),
      gender: Joi.number().integer().valid(0, 1, 2),
      birthday: Joi.string().allow(null, ''),
      region: Joi.string().max(100).allow(null, ''),
      signature: Joi.string().max(200).allow(null, ''),
      userType: Joi.number().integer().valid(1, 2, 3),
      creatorLevel: Joi.number().integer().valid(0, 1, 2, 3, 4),
      memberLevel: Joi.number().integer().valid(0, 1, 2, 3, 4),
      userTags: Joi.array(),
      riskTags: Joi.array(),
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await EndUserService.updateUser(parseInt(req.params.id), req.body, req.user);
        return success(res, null, '用户信息更新成功');
      } catch (e) { next(e); }
    }
  ];

  changeStatus = [
    validate(Joi.object({
      toStatus: Joi.number().integer().valid(1, 2, 3, 4, 5).required(),
      reason: Joi.string().max(500).required(),
      remark: Joi.string().max(500).allow(null, ''),
      durationDays: Joi.number().integer().min(1).max(365).allow(null, ''),
      flowLimitLevel: Joi.number().integer().valid(0, 1, 2, 3),
      operationType: Joi.string().valid('MANUAL', 'BATCH', 'SYSTEM'),
      extraData: Joi.object(),
    })),
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        const validation = await EndUserService.validateStatusChange(id, req.body.toStatus, req.user);
        if (!validation.canChange) {
          return res.status(400).json({
            code: 400,
            message: validation.reasons[0] || '状态变更校验不通过',
            data: validation,
          });
        }
        const result = await EndUserService.changeAccountStatus(id, req.body, req.user);
        return success(res, result, '状态变更成功');
      } catch (e) { next(e); }
    }
  ];

  validateChange = [
    validate(Joi.object({
      toStatus: Joi.number().integer().valid(1, 2, 3, 4, 5).required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await EndUserService.validateStatusChange(
          parseInt(req.params.id),
          parseInt(req.query.toStatus),
          req.user
        );
        return success(res, result);
      } catch (e) { next(e); }
    }
  ];

  batchOperation = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      action: Joi.string().valid(
        'UNBAN_LOW_VIOLATION', 'FLOW_LIMIT_LOW_QUALITY', 'ACTIVATE_DORMANT',
        'BATCH_UNBAN', 'BATCH_FLOW_LIMIT', 'BATCH_TEMP_BAN'
      ).required(),
      reason: Joi.string().max(500).allow(null, ''),
      remark: Joi.string().max(500).allow(null, ''),
      flowLimitLevel: Joi.number().integer().valid(1, 2, 3),
      durationDays: Joi.number().integer().min(1).max(365),
    })),
    async (req, res, next) => {
      try {
        const result = await EndUserService.batchOperation(req.body, req.user);
        return success(res, result, '批量操作执行完成');
      } catch (e) { next(e); }
    }
  ];

  getStatusLogs = [
    validate(paginationSchema.keys({
      userId: Joi.number().integer().allow(null, ''),
      uid: Joi.string().allow(null, ''),
      operationBatch: Joi.string().allow(null, ''),
      operatorId: Joi.number().integer().allow(null, ''),
      operationType: Joi.string().allow(null, ''),
      toStatus: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await EndUserService.getStatusLogs(req.query);
        return paginated(res, result);
      } catch (e) { next(e); }
    }
  ];

  getStats = [
    async (req, res, next) => {
      try {
        const result = await EndUserService.getStatusStats();
        return success(res, result);
      } catch (e) { next(e); }
    }
  ];

  validateDuplicate = [
    validate(Joi.object({
      username: Joi.string().allow(null, ''),
      phone: Joi.string().allow(null, ''),
      uid: Joi.string().allow(null, ''),
      checkType: Joi.string().valid('CREATE', 'UPDATE', 'ALL'),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await EndUserService.validateDuplicate(req.query);
        return success(res, result);
      } catch (e) { next(e); }
    }
  ];
}

module.exports = new EndUserController();
