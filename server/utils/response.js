function success(data = null, message = '操作成功') {
  return {
    code: 200,
    message,
    data
  };
}

function error(message = '操作失败', code = 400) {
  return {
    code,
    message,
    data: null
  };
}

function unauthorized(message = '未授权访问') {
  return {
    code: 401,
    message,
    data: null
  };
}

function forbidden(message = '无权限访问') {
  return {
    code: 403,
    message,
    data: null
  };
}

function notFound(message = '资源不存在') {
  return {
    code: 404,
    message,
    data: null
  };
}

module.exports = {
  success,
  error,
  unauthorized,
  forbidden,
  notFound
};
