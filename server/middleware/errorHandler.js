const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(error(errors.join('; ')));
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json(error('数据已存在'));
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json(error(err.message, err.statusCode));
  }

  res.status(500).json(error('服务器内部错误', 500));
}

module.exports = errorHandler;
