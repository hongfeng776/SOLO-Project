const { verify } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/error');

const auth = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new UnauthorizedError('请先登录');
      }
      
      const payload = verify(token);
      
      if (!payload) {
        throw new UnauthorizedError('登录已过期，请重新登录');
      }
      
      req.user = payload;
      
      if (requiredRoles.length > 0 && payload.roleCode) {
        if (!requiredRoles.includes(payload.roleCode)) {
          throw new UnauthorizedError('权限不足');
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = auth;
