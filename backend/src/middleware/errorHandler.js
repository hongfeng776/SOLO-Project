const { error, ResponseCode } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || '服务器内部错误';
  let code = ResponseCode.INTERNAL_ERROR;

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    code = ResponseCode.BAD_REQUEST;
    const errors = err.errors.map(e => e.message);
    message = '数据验证失败: ' + errors.join(', ');
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    code = ResponseCode.BAD_REQUEST;
    message = '数据已存在';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ResponseCode.UNAUTHORIZED;
    message = '认证令牌无效';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ResponseCode.UNAUTHORIZED;
    message = '认证令牌已过期';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    code = err.code || statusCode;
  }

  const response = error(code, message, process.env.NODE_ENV === 'development' ? err.stack : undefined);

  res.status(statusCode).json(response);
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json(error(ResponseCode.NOT_FOUND, '接口不存在'));
};

module.exports = { errorHandler, notFoundHandler };
