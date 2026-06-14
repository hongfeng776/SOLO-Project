﻿const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, businessError } = require('../utils/response');
const { ErrorCode } = require('../constants/errorCode');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '用户名和密码不能为空'));
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json(businessError(ErrorCode.USER_PASSWORD_ERROR));
    }

    if (user.status !== 1) {
      return res.status(403).json(businessError(ErrorCode.USER_DISABLED));
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json(businessError(ErrorCode.USER_PASSWORD_ERROR));
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json(success({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role
      }
    }, '登录成功'));
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'nickname', 'avatar', 'role', 'created_at']
    });
    if (!user) {
      return res.status(404).json(businessError(ErrorCode.USER_NOT_EXIST));
    }
    res.json(success(user.toJSON()));
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.json(success(null, '退出成功'));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  getProfile,
  logout
};
