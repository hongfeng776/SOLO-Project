const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { unauthorized } = require('../utils/response');
const jwtConfig = require('../config/jwt');

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json(unauthorized('未提供认证令牌'));
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(unauthorized('认证令牌已过期'));
    }
    return res.status(401).json(unauthorized('认证令牌无效'));
  }
});

module.exports = authMiddleware;
