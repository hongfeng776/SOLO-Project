const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { Role, Permission } = require('../models');
const { success, badRequest, notFound, sendSuccess } = require('../utils/response');

const getRoles = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 10, name, status } = req.query;
  const offset = (page - 1) * pageSize;

  const where = {};
  if (name) where.name = { [Op.like]: `%${name}%` };
  if (status !== undefined) where.status = status;

  const { count, rows } = await Role.findAndCountAll({
    where,
    offset,
    limit: parseInt(pageSize),
    order: [['id', 'DESC']]
  });

  sendSuccess(res, {
    list: rows,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  }, '获取角色列表成功');
});

const getRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findByPk(id, {
    include: [
      {
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'code'],
        through: { attributes: [] }
      }
    ]
  });

  if (!role) {
    return res.status(404).json(notFound('角色不存在'));
  }

  sendSuccess(res, role, '获取角色详情成功');
});

const createRole = asyncHandler(async (req, res) => {
  const { name, code, description, status = 1 } = req.body;

  if (!name || !code) {
    return res.status(400).json(badRequest('角色名称和编码不能为空'));
  }

  const existingRole = await Role.findOne({ where: { code } });
  if (existingRole) {
    return res.status(400).json(badRequest('角色编码已存在'));
  }

  const role = await Role.create({ name, code, description, status });

  sendSuccess(res, role, '创建角色成功', 201);
});

const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, description, status } = req.body;

  const role = await Role.findByPk(id);
  if (!role) {
    return res.status(404).json(notFound('角色不存在'));
  }

  if (code && code !== role.code) {
    const existingRole = await Role.findOne({ where: { code } });
    if (existingRole) {
      return res.status(400).json(badRequest('角色编码已存在'));
    }
  }

  await role.update({ name, code, description, status });

  sendSuccess(res, role, '更新角色成功');
});

const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findByPk(id);
  if (!role) {
    return res.status(404).json(notFound('角色不存在'));
  }

  const users = await role.getUsers();
  if (users && users.length > 0) {
    return res.status(400).json(badRequest('该角色下存在用户，无法删除'));
  }

  await role.destroy();

  sendSuccess(res, null, '删除角色成功');
});

const assignPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissionIds } = req.body;

  const role = await Role.findByPk(id);
  if (!role) {
    return res.status(404).json(notFound('角色不存在'));
  }

  if (!Array.isArray(permissionIds)) {
    return res.status(400).json(badRequest('权限ID列表格式错误'));
  }

  const permissions = await Permission.findAll({
    where: { id: permissionIds }
  });

  await role.setPermissions(permissions);

  sendSuccess(res, null, '分配权限成功');
});

const getRolePermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findByPk(id, {
    include: [
      {
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }
    ]
  });

  if (!role) {
    return res.status(404).json(notFound('角色不存在'));
  }

  sendSuccess(res, role.permissions || [], '获取角色权限成功');
});

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
  getRolePermissions
};
