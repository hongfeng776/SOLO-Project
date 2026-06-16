const UserService = require('../services/UserService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class UserController {
  getList = [
    validate(paginationSchema.keys({
      roleId: Joi.number().integer().allow(null, ''),
      status: Joi.number().integer().valid(0, 1, 2).allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await UserService.getUserList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getById = [
    async (req, res, next) => {
      try {
        const result = await UserService.getUserById(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  create = [
    validate(Joi.object({
      username: Joi.string().required().min(3).max(50),
      password: Joi.string().allow(null, '').min(6).max(50),
      realName: Joi.string().allow(null, ''),
      email: Joi.string().email().allow(null, ''),
      phone: Joi.string().allow(null, ''),
      avatar: Joi.string().allow(null, ''),
      roleId: Joi.number().integer().required(),
      department: Joi.string().allow(null, ''),
      status: Joi.number().integer().valid(0, 1, 2),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const id = await UserService.createUser(req.body, req.user?.userId);
        return created(res, { id }, '用户创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  update = [
    validate(Joi.object({
      username: Joi.string().min(3).max(50).allow(null, ''),
      password: Joi.string().allow(null, '').min(6).max(50),
      realName: Joi.string().allow(null, ''),
      email: Joi.string().email().allow(null, ''),
      phone: Joi.string().allow(null, ''),
      avatar: Joi.string().allow(null, ''),
      roleId: Joi.number().integer(),
      department: Joi.string().allow(null, ''),
      status: Joi.number().integer().valid(0, 1, 2),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await UserService.updateUser(parseInt(req.params.id), req.body, req.user?.userId);
        return success(res, null, '用户更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  delete = [
    async (req, res, next) => {
      try {
        await UserService.deleteUser(parseInt(req.params.id));
        return success(res, null, '用户删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  batchDelete = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        await UserService.batchDeleteUsers(req.body.ids);
        return success(res, null, '批量删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  updateStatus = [
    validate(Joi.object({
      status: Joi.number().integer().valid(0, 1, 2).required(),
    })),
    async (req, res, next) => {
      try {
        await UserService.updateUserStatus(parseInt(req.params.id), req.body.status);
        return success(res, null, '状态更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new UserController();
