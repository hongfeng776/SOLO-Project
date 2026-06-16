class AppError extends Error {
  constructor(message, statusCode = 500, code = 500) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

const success = (data = null, message = '操作成功', code = 200) => {
  return {
    code,
    message,
    data
  }
}

const fail = (message = '操作失败', code = 400) => {
  return {
    code,
    message,
    data: null
  }
}

const pageResult = (list, total, page = 1, pageSize = 10) => {
  return {
    code: 200,
    message: '获取成功',
    data: {
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  }
}

module.exports = {
  AppError,
  success,
  fail,
  pageResult
}
