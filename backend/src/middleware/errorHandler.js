const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.code = err.code || 'INTERNAL_ERROR';

  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', err);
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = {};
    err.errors.forEach((e) => {
      errors[e.path] = e.message;
    });
    error.statusCode = 422;
    error.code = 'VALIDATION_ERROR';
    error.message = '数据验证失败';
    error.errors = errors;
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    error.statusCode = 409;
    error.code = 'DUPLICATE_DATA';
    error.message = '数据重复';
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error.statusCode = 400;
    error.code = 'FOREIGN_KEY_ERROR';
    error.message = '关联数据错误';
  }

  if (err.type === 'entity.parse.failed' || err.name === 'SyntaxError') {
    error.statusCode = 400;
    error.code = 'BAD_REQUEST';
    error.message = '请求体格式错误';
  }

  if (err.name === 'MulterError') {
    error.statusCode = 400;
    error.code = 'FILE_UPLOAD_ERROR';
    error.message = '文件上传错误: ' + err.message;
  }

  return res.status(error.statusCode).json({
    code: error.code,
    message: error.message,
    errors: error.errors || undefined,
    data: null,
    timestamp: Date.now(),
  });
};

const notFoundHandler = (req, res, next) => {
  return next(new AppError(`请求路径 ${req.originalUrl} 不存在`, 404, 'NOT_FOUND'));
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
