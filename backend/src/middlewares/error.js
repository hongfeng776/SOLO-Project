const ApiResponse = require('../utils/response')
const ApiError = require('../utils/apiError')
const config = require('../config')

const notFoundHandler = (req, res, next) => {
  res.status(404).json(ApiResponse.notFound('接口不存在'))
}

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  if (err instanceof ApiError) {
    return res.json(ApiResponse.error(err.code, err.message, err.data))
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message)
    return res.json(ApiResponse.badRequest(errors.join(', ') || '参数验证失败'))
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.json(ApiResponse.badRequest('数据已存在'))
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => e.message)
    return res.json(ApiResponse.badRequest(errors.join(', ') || '数据验证失败'))
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.json(ApiResponse.badRequest('文件大小超出限制'))
  }

  const statusCode = err.statusCode || err.status || 500
  const message = err.message || '服务器内部错误'

  if (config.app.env === 'development') {
    return res.status(statusCode).json({
      code: statusCode,
      message,
      data: null,
      stack: err.stack,
      timestamp: Date.now()
    })
  }

  res.status(statusCode).json(ApiResponse.error(statusCode, message))
}

module.exports = {
  notFoundHandler,
  errorHandler
}
