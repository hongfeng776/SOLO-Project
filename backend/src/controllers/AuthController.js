const AuthService = require('../services/AuthService');
const { success, created } = require('../utils/response');
const { validate, Joi } = require('../middleware/validator');

class AuthController {
  login = [
    validate(Joi.object({
      username: Joi.string().required().min(3).max(50).message('用户名必填'),
      password: Joi.string().required().min(6).max(50).message('密码必填'),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        const result = await AuthService.login({ ...req.body, ip });
        return success(res, result, '登录成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  logout = [
    async (req, res, next) => {
      try {
        await AuthService.logout(req.user.userId);
        return success(res, null, '登出成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  refreshToken = [
    validate(Joi.object({
      refreshToken: Joi.string().required().message('刷新令牌必填'),
    })),
    async (req, res, next) => {
      try {
        const result = await AuthService.refreshToken(req.body.refreshToken);
        return success(res, result, '刷新令牌成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  changePassword = [
    validate(Joi.object({
      oldPassword: Joi.string().required().message('原密码必填'),
      newPassword: Joi.string().required().min(6).max(50).message('新密码长度6-50位'),
    })),
    async (req, res, next) => {
      try {
        const { oldPassword, newPassword } = req.body;
        await AuthService.changePassword(req.user.userId, oldPassword, newPassword);
        return success(res, null, '密码修改成功，请重新登录');
      } catch (error) {
        next(error);
      }
    }
  ];

  getCurrentUser = [
    async (req, res, next) => {
      try {
        const result = await AuthService.getCurrentUser(req.user.userId);
        return success(res, result, '获取用户信息成功');
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new AuthController();
