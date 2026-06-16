class ApiError extends Error {
  constructor(code, message, data = null) {
    super(message)
    this.code = code
    this.data = data
    this.name = 'ApiError'
  }

  static badRequest(message = '请求参数错误', data = null) {
    return new ApiError(400, message, data)
  }

  static unauthorized(message = '未授权，请先登录', data = null) {
    return new ApiError(401, message, data)
  }

  static forbidden(message = '没有权限访问', data = null) {
    return new ApiError(403, message, data)
  }

  static notFound(message = '资源不存在', data = null) {
    return new ApiError(404, message, data)
  }

  static internal(message = '服务器内部错误', data = null) {
    return new ApiError(500, message, data)
  }
}

module.exports = ApiError
