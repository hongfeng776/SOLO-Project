const { verifyToken, getStoredToken } = require('../utils/auth');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ') {
      return next(new UnauthorizedError('缺少Authorization头格式错误'));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(new UnauthorizedError('缺少访问令牌'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new UnauthorizedError('令牌无效或已过期'));
    }

    if (decoded.type !== 'access') {
      return next(new UnauthorizedError('令牌类型错误'));
    }

    const storedToken = await getStoredToken(decoded.userId, 'access');
    if (!storedToken || storedToken !== token) {
      return next(new UnauthorizedError('令牌已失效，请重新登录'));
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      roleId: decoded.roleId,
      roleCode: decoded.roleCode,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.roleCode)) {
      return next(new ForbiddenError('角色权限不足'));
    }
    next();
  };
};

const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every((p => 
      userPermissions.includes(p) || userPermissions.includes('*')
    );
    if (!hasPermission) {
      return next(new ForbiddenError('操作权限不足'));
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ') {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.type === 'access') {
        req.user = {
          userId: decoded.userId,
          username: decoded.username,
          roleId: decoded.roleId,
          roleCode: decoded.roleCode,
          permissions: decoded.permissions || [],
        };
      }
    }
  } catch (error) {
  } finally {
    next();
  }
};

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
  optionalAuth,
};
