const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { User, Role } = require('../models');
const { success, badRequest, notFound, sendSuccess } = require('../utils/response');

const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 10, username, nickname, status } = req.query;
  const offset = (page - 1) * pageSize;

  const where = {};
  if (username) where.username = { [Op.like]: `%${username}%` };
  if (nickname) where.nickname = { [Op.like]: `%${nickname}%` };
  if (status !== undefined) where.status = status;

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    offset,
    limit: parseInt(pageSize),
    order: [['id', 'DESC']],
    include: [
      {
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'code'],
        through: { attributes: [] }
      }
    ]
  });

  sendSuccess(res, {
    list: rows,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  }, '获取用户列表成功');
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'code'],
        through: { attributes: [] }
      }
    ]
  });

  if (!user) {
    return res.status(404).json(notFound('用户不存在'));
  }

  sendSuccess(res, user, '获取用户详情成功');
});

const createUser = asyncHandler(async (req, res) => {
  const { username, password, nickname, email, status = 1 } = req.body;

  if (!username || !password) {
    return res.status(400).json(badRequest('用户名和密码不能为空'));
  }

  if (password.length < 6) {
    return res.status(400).json(badRequest('密码长度不能少于6位'));
  }

  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    return res.status(400).json(badRequest('用户名已存在'));
  }

  const user = await User.create({
    username,
    password,
    nickname: nickname || username,
    email: email || null,
    role: 'user',
    status
  });

  const userInfo = user.toJSON();
  delete userInfo.password;

  sendSuccess(res, userInfo, '创建用户成功', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nickname, email, status } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json(notFound('用户不存在'));
  }

  await user.update({ nickname, email, status });

  const userInfo = user.toJSON();
  delete userInfo.password;

  sendSuccess(res, userInfo, '更新用户成功');
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json(notFound('用户不存在'));
  }

  if (parseInt(id) === parseInt(req.user.id)) {
    return res.status(400).json(badRequest('不能删除当前登录用户'));
  }

  await user.destroy();

  sendSuccess(res, null, '删除用户成功');
});

const assignRoles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roleIds } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json(notFound('用户不存在'));
  }

  if (!Array.isArray(roleIds)) {
    return res.status(400).json(badRequest('角色ID列表格式错误'));
  }

  const roles = await Role.findAll({
    where: { id: roleIds, status: 1 }
  });

  await user.setRoles(roles);

  sendSuccess(res, null, '分配角色成功');
});

const getUserRoles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    include: [
      {
        model: Role,
        as: 'roles',
        where: { status: 1 },
        required: false,
        through: { attributes: [] }
      }
    ]
  });

  if (!user) {
    return res.status(404).json(notFound('用户不存在'));
  }

  sendSuccess(res, user.roles || [], '获取用户角色成功');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json(badRequest('新密码长度不能少于6位'));
  }

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json(notFound('用户不存在'));
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, null, '重置密码成功');
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignRoles,
  getUserRoles,
  resetPassword
};
