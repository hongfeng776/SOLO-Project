const RoleService = require('../services/RoleService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class RoleController {
  getList = [
    validate(paginationSchema, 'query'),
    async (req, res, next) => {
      try {
        const result = await RoleService.getRoleList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getAll = [
    async (req, res, next) => {
      try {
        const result = await RoleService.getAllRoles();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getById = [
    async (req, res, next) => {
      try {
        const result = await RoleService.getRoleById(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  create = [
    validate(Joi.object({
      code: Joi.string().required().max(50),
      name: Joi.string().required().max(50),
      description: Joi.string().allow(null, ''),
      permissions: Joi.array().items(Joi.string()),
      sortOrder: Joi.number().integer().min(0),
      status: Joi.number().integer().valid(0, 1),
    })),
    async (req, res, next) => {
      try {
        const id = await RoleService.createRole(req.body, req.user?.userId);
        return created(res, { id }, '角色创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  update = [
    validate(Joi.object({
      code: Joi.string().max(50),
      name: Joi.string().max(50),
      description: Joi.string().allow(null, ''),
      permissions: Joi.array().items(Joi.string()),
      sortOrder: Joi.number().integer().min(0),
      status: Joi.number().integer().valid(0, 1),
    })),
    async (req, res, next) => {
      try {
        await RoleService.updateRole(parseInt(req.params.id), req.body, req.user?.userId);
        return success(res, null, '角色更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  delete = [
    async (req, res, next) => {
      try {
        await RoleService.deleteRole(parseInt(req.params.id));
        return success(res, null, '角色删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new RoleController();
