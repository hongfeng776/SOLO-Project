const jwt = require('jsonwebtoken')
const config = require('../config')
const ApiResponse = require('../utils/response')
const ApiError = require('../utils/apiError')

const authMiddleware = (required = true) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (!required) {
          req.user = null
          return next()
        }
        return res.json(ApiResponse.unauthorized())
      }

      const token = authHeader.slice(7)

      if (!token) {
        if (!required) {
          req.user = null
          return next()
        }
        return res.json(ApiResponse.unauthorized())
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret)
        req.user = decoded
        next()
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.json(ApiResponse.error(401, '登录已过期，请重新登录'))
        }
        return res.json(ApiResponse.unauthorized('无效的token'))
      }
    } catch (error) {
      next(error)
    }
  }
}

const roleMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const user = req.user

      if (!user) {
        return res.json(ApiResponse.unauthorized())
      }

      if (roles.length === 0) {
        return next()
      }

      if (!roles.includes(user.role)) {
        return res.json(ApiResponse.forbidden())
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = {
  authMiddleware,
  roleMiddleware
}
