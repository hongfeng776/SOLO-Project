const { error, unauthorized, forbidden, notFound, businessError } = require('../utils/response');
const { ErrorCode, ErrorMessage } = require('../constants/errorCode');

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(businessError(ErrorCode.PARAM_INVALID, errors.join('; ')));
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json(businessError(ErrorCode.DATA_ALREADY_EXIST));
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => e.message);
    return res.status(400).json(businessError(ErrorCode.PARAM_INVALID, errors.join('; ')));
  }

  if (err.code === 'ENOENT' || err.name === 'NotFoundError') {
    return res.status(404).json(notFound(err.message));
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(businessError(ErrorCode.USER_TOKEN_INVALID));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(businessError(ErrorCode.USER_TOKEN_EXPIRED));
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

  if (err.businessCode) {
    return res.status(400).json(businessError(err.businessCode, err.message));
  }

  res.status(500).json(businessError(ErrorCode.INTERNAL_ERROR));
}

module.exports = errorHandler;
