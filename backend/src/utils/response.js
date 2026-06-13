const ResponseCode = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};

const success = (data = null, message = '操作成功') => {
  return {
    code: ResponseCode.SUCCESS,
    message,
    data
  };
};

const error = (code = ResponseCode.INTERNAL_ERROR, message = '操作失败', data = null) => {
  return {
    code,
    message,
    data
  };
};

const badRequest = (message = '请求参数错误', data = null) => {
  return error(ResponseCode.BAD_REQUEST, message, data);
};

const unauthorized = (message = '未授权，请先登录', data = null) => {
  return error(ResponseCode.UNAUTHORIZED, message, data);
};

const forbidden = (message = '权限不足，无法访问', data = null) => {
  return error(ResponseCode.FORBIDDEN, message, data);
};

const notFound = (message = '资源不存在', data = null) => {
  return error(ResponseCode.NOT_FOUND, message, data);
};

const sendSuccess = (res, data = null, message = '操作成功', statusCode = 200) => {
  res.status(statusCode).json(success(data, message));
};

const sendError = (res, code, message, data = null, statusCode = 200) => {
  res.status(statusCode).json(error(code, message, data));
};

module.exports = {
  ResponseCode,
  success,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  sendSuccess,
  sendError
};
