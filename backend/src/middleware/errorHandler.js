const { fail } = require('../utils/response')

const notFound = (req, res, next) => {
  res.status(404).json(fail(`请求路径 ${req.originalUrl} 不存在`, 404))
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || '服务器内部错误'
  let code = err.code || 500

  if (err.name === 'ValidationError') {
    statusCode = 400
    code = 400
    const errors = Object.values(err.errors).map(el => el.message)
    message = errors.join(', ')
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    code = 401
    message = '无效的token，请重新登录'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    code = 401
    message = 'token已过期，请重新登录'
  }

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400
    code = 400
    message = err.errors.map(e => e.message).join(', ')
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400
    code = 400
    message = '数据已存在，请勿重复提交'
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('错误详情:', err)
  }

  res.status(statusCode).json({
    code,
    message,
    data: null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

module.exports = {
  notFound,
  errorHandler
}
