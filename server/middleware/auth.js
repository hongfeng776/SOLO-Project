const jwt = require('jsonwebtoken');
const { businessError } = require('../utils/response');
const { ErrorCode } = require('../constants/errorCode');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json(businessError(ErrorCode.USER_NOT_LOGIN));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(businessError(ErrorCode.USER_TOKEN_EXPIRED));
    }
    return res.status(401).json(businessError(ErrorCode.USER_TOKEN_INVALID));
  }
}

module.exports = authMiddleware;
