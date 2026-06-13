const asyncHandler = require('express-async-handler');
const { Permission } = require('../models');
const { success, badRequest, notFound, sendSuccess } = require('../utils/response');

const buildTree = (permissions, parentId = null) => {
  const tree = [];
  permissions.forEach(permission => {
    if (permission.parent_id === parentId) {
      const children = buildTree(permissions, permission.id);
      if (children.length > 0) {
        permission.dataValues.children = children;
      }
      tree.push(permission);
    }
  });
  return tree.sort((a, b) => a.sort - b.sort);
};

const getPermissions = asyncHandler(async (req, res) => {
  const { type, tree = 'true' } = req.query;

  const where = {};
  if (type) where.type = type;

  const permissions = await Permission.findAll({
    where,
    order: [['sort', 'ASC'], ['id', 'ASC']]
  });

  let result = permissions;
  if (tree === 'true') {
    result = buildTree(permissions);
  }

  sendSuccess(res, result, '获取权限列表成功');
});

const getPermissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const permission = await Permission.findByPk(id);
  if (!permission) {
    return res.status(404).json(notFound('权限不存在'));
  }

  sendSuccess(res, permission, '获取权限详情成功');
});

const createPermission = asyncHandler(async (req, res) => {
  const { name, code, type = 'menu', path, component, icon, sort = 0, parent_id } = req.body;

  if (!name || !code) {
    return res.status(400).json(badRequest('权限名称和编码不能为空'));
  }

  const existingPermission = await Permission.findOne({ where: { code } });
  if (existingPermission) {
    return res.status(400).json(badRequest('权限编码已存在'));
  }

  if (parent_id) {
    const parent = await Permission.findByPk(parent_id);
    if (!parent) {
      return res.status(400).json(badRequest('父级权限不存在'));
    }
  }

  const permission = await Permission.create({
    name, code, type, path, component, icon, sort, parent_id
  });

  sendSuccess(res, permission, '创建权限成功', 201);
});

const updatePermission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, type, path, component, icon, sort, parent_id } = req.body;

  const permission = await Permission.findByPk(id);
  if (!permission) {
    return res.status(404).json(notFound('权限不存在'));
  }

  if (code && code !== permission.code) {
    const existingPermission = await Permission.findOne({ where: { code } });
    if (existingPermission) {
      return res.status(400).json(badRequest('权限编码已存在'));
    }
  }

  if (parent_id && parent_id !== permission.parent_id) {
    const parent = await Permission.findByPk(parent_id);
    if (!parent) {
      return res.status(400).json(badRequest('父级权限不存在'));
    }
  }

  if (parent_id && parseInt(parent_id) === parseInt(id)) {
    return res.status(400).json(badRequest('不能将自己设为父级权限'));
  }

  await permission.update({ name, code, type, path, component, icon, sort, parent_id });

  sendSuccess(res, permission, '更新权限成功');
});

const deletePermission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const permission = await Permission.findByPk(id);
  if (!permission) {
    return res.status(404).json(notFound('权限不存在'));
  }

  const children = await Permission.findAll({ where: { parent_id: id } });
  if (children.length > 0) {
    return res.status(400).json(badRequest('该权限下存在子权限，无法删除'));
  }

  const roles = await permission.getRoles();
  if (roles && roles.length > 0) {
    return res.status(400).json(badRequest('该权限已分配给角色，无法删除'));
  }

  await permission.destroy();

  sendSuccess(res, null, '删除权限成功');
});

const getPermissionTree = asyncHandler(async (req, res) => {
  const permissions = await Permission.findAll({
    order: [['sort', 'ASC'], ['id', 'ASC']]
  });

  const tree = buildTree(permissions);

  sendSuccess(res, tree, '获取权限树成功');
});

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionTree
};
