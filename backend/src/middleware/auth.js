const jwt = require('jsonwebtoken')
const { AppError } = require('../utils/response')

const authenticate = (req, res, next) => {
  let token = null

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('请先登录', 401, 401))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cxzl_admin_secret_key_2024')
    req.user = decoded
    next()
  } catch (error) {
    return next(new AppError('登录状态已过期，请重新登录', 401, 401))
  }
}

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('权限不足，无法访问', 403, 403))
    }
    next()
  }
}

module.exports = {
  authenticate,
  requireRole
}
