class ApiResponse {
  constructor(code = 200, message = 'success', data = null) {
    this.code = code
    this.message = message
    this.data = data
    this.timestamp = Date.now()
  }

  static success(data = null, message = '操作成功') {
    return new ApiResponse(200, message, data)
  }

  static error(code = 500, message = '操作失败', data = null) {
    return new ApiResponse(code, message, data)
  }

  static page(list = [], total = 0, page = 1, pageSize = 20) {
    return new ApiResponse(200, '查询成功', {
      list,
      total,
      page,
      pageSize
    })
  }

  static badRequest(message = '请求参数错误') {
    return new ApiResponse(400, message, null)
  }

  static unauthorized(message = '未授权，请先登录') {
    return new ApiResponse(401, message, null)
  }

  static forbidden(message = '没有权限访问') {
    return new ApiResponse(403, message, null)
  }

  static notFound(message = '资源不存在') {
    return new ApiResponse(404, message, null)
  }
}

module.exports = ApiResponse
