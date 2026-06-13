const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/response');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json(unauthorized('请先登录'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(unauthorized('Token已过期，请重新登录'));
    }
    return res.status(401).json(unauthorized('Token无效，请重新登录'));
  }
}

module.exports = authMiddleware;
