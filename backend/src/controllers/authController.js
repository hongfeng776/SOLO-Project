const authService = require('../services/authService')
const ApiResponse = require('../utils/response')

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body
      const ip = req.ip || req.connection.remoteAddress

      const result = await authService.login(username, password, ip)

      res.json(ApiResponse.success(result, '登录成功'))
    } catch (error) {
      next(error)
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout()
      res.json(ApiResponse.success(null, '退出成功'))
    } catch (error) {
      next(error)
    }
  }

  async getUserInfo(req, res, next) {
    try {
      const userId = req.user.id
      const user = await authService.getUserInfo(userId)
      res.json(ApiResponse.success(user))
    } catch (error) {
      next(error)
    }
  }

  async register(req, res, next) {
    try {
      const result = await authService.register(req.body)
      res.json(ApiResponse.success(result, '注册成功'))
    } catch (error) {
      next(error)
    }
  }

  async refreshToken(req, res, next) {
    try {
      const userId = req.user.id
      const user = await authService.getUserInfo(userId)

      const { generateToken } = require('../utils/auth')
      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role
      })

      res.json(ApiResponse.success({ token }, '刷新成功'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AuthController()
