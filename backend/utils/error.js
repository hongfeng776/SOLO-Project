class ApiError extends Error {
  constructor(message, code = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = '未授权访问', data = null) {
    super(message, 401, data);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends ApiError {
  constructor(message = '禁止访问', data = null) {
    super(message, 403, data);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends ApiError {
  constructor(message = '资源不存在', data = null) {
    super(message, 404, data);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends ApiError {
  constructor(message = '参数验证失败', data = null) {
    super(message, 400, data);
    this.name = 'ValidationError';
  }
}

module.exports = {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError
};
