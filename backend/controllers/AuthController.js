const { success } = require('../utils/result');
const authService = require('../services/AuthService');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(success(result, '登录成功'));
  } catch (error) {
    next(error);
  }
};

const getUserInfo = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const result = await authService.getUserInfo(userId);
    res.json(success(result));
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout();
    res.json(success(null, '登出成功'));
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getUserInfo, logout };
