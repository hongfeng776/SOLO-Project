const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { User, Role, Permission } = require('../models');
const jwtConfig = require('../config/jwt');
const { success, badRequest, unauthorized, sendSuccess } = require('../utils/response');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

const getUserRolesAndPermissions = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'roles',
        where: { status: 1 },
        required: false,
        attributes: ['id', 'name', 'code'],
        through: { attributes: [] },
        include: [
          {
            model: Permission,
            as: 'permissions',
            required: false,
            attributes: ['id', 'name', 'code', 'type', 'path', 'component', 'icon', 'sort', 'parent_id'],
            through: { attributes: [] }
          }
        ]
      }
    ]
  });

  if (!user) {
    return { roles: [], permissions: [], permissionCodes: [] };
  }

  const roles = user.roles || [];
  const permissions = [];
  const permissionCodes = [];

  roles.forEach(role => {
    if (role.permissions) {
      role.permissions.forEach(permission => {
        if (!permissionCodes.includes(permission.code)) {
          permissions.push(permission);
          permissionCodes.push(permission.code);
        }
      });
      delete role.dataValues.permissions;
    }
  });

  return { roles, permissions, permissionCodes };
};

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json(badRequest('用户名和密码不能为空'));
  }

  const user = await User.findOne({
    where: { username },
    attributes: ['id', 'username', 'password', 'nickname', 'email', 'role', 'status']
  });

  if (!user) {
    return res.status(401).json(unauthorized('用户名或密码错误'));
  }

  if (user.status !== 1) {
    return res.status(401).json(unauthorized('账号已被禁用，请联系管理员'));
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json(unauthorized('用户名或密码错误'));
  }

  const token = generateToken(user);
  const { roles, permissions, permissionCodes } = await getUserRolesAndPermissions(user.id);

  const userInfo = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    roles,
    permissions,
    permissionCodes
  };

  sendSuccess(res, {
    token,
    user: userInfo
  }, '登录成功');
});

const register = asyncHandler(async (req, res) => {
  const { username, password, nickname, email } = req.body;

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
    status: 1
  });

  const token = generateToken(user);

  const userInfo = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    role: user.role
  };

  sendSuccess(res, {
    token,
    user: userInfo
  }, '注册成功', 201);
});

const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, null, '退出登录成功');
});

const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'username', 'nickname', 'email', 'role', 'status']
  });

  if (!user) {
    return res.status(404).json(unauthorized('用户不存在'));
  }

  if (user.status !== 1) {
    return res.status(401).json(unauthorized('账号已被禁用，请联系管理员'));
  }

  const token = generateToken(user);
  const { roles, permissions, permissionCodes } = await getUserRolesAndPermissions(user.id);

  const userInfo = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    roles,
    permissions,
    permissionCodes
  };

  sendSuccess(res, {
    token,
    user: userInfo
  }, '刷新令牌成功');
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'username', 'nickname', 'email', 'role', 'status', 'created_at']
  });

  if (!user) {
    return res.status(404).json(unauthorized('用户不存在'));
  }

  const { roles, permissions, permissionCodes } = await getUserRolesAndPermissions(user.id);

  const userInfo = {
    ...user.toJSON(),
    roles,
    permissions,
    permissionCodes
  };

  sendSuccess(res, userInfo, '获取用户信息成功');
});

module.exports = {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser
};
