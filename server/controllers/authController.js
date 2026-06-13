const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, error, unauthorized } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(error('用户名和密码不能为空'));
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json(unauthorized('用户名或密码错误'));
    }

    if (user.status !== 1) {
      return res.status(403).json(error('账号已被禁用'));
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json(unauthorized('用户名或密码错误'));
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
    res.json(success(user));
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
