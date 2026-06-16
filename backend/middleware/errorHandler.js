const { fail } = require('../utils/result');
const { ApiError } = require('../utils/error');

const errorHandler = (err, req, res, next) => {
  console.error('错误信息:', err);
  
  if (err instanceof ApiError) {
    return res.json(fail(err.message, err.code, err.data));
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.json(fail('Token无效', 401));
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.json(fail('Token已过期', 401));
  }
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.json(fail('数据验证失败', 400, errors));
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.json(fail('数据已存在', 400));
  }
  
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.json(fail('关联数据不存在', 400));
  }
  
  return res.json(fail('服务器内部错误', 500));
};

module.exports = errorHandler;
