const { error, unauthorized, forbidden, notFound } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(error(errors.join('; ')));
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json(error('数据已存在'));
  }

  if (err.code === 'ENOENT' || err.name === 'NotFoundError') {
    return res.status(404).json(notFound(err.message));
  }

  if (err.statusCode) {
    switch (err.statusCode) {
      case 401:
        return res.status(401).json(unauthorized(err.message));
      case 403:
        return res.status(403).json(forbidden(err.message));
      case 404:
        return res.status(404).json(notFound(err.message));
      default:
        return res.status(err.statusCode).json(error(err.message));
    }
  }

  res.status(500).json(error('服务器内部错误'));
}

module.exports = errorHandler;
