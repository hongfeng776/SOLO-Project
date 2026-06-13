const asyncHandler = require('express-async-handler');
const { User, Role, Permission } = require('../models');
const { forbidden } = require('../utils/response');

const getUserPermissions = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'roles',
        where: { status: 1 },
        required: false,
        include: [
          {
            model: Permission,
            as: 'permissions',
            required: false
          }
        ]
      }
    ]
  });

  if (!user) {
    return { roles: [], permissions: [], permissionCodes: [] };
  }

  const roles = user.roles || [];
  const permissions = [];
  const permissionCodes = [];

  roles.forEach(role => {
    if (role.permissions) {
      role.permissions.forEach(permission => {
        if (!permissionCodes.includes(permission.code)) {
          permissions.push(permission);
          permissionCodes.push(permission.code);
        }
      });
    }
  });

  return { roles, permissions, permissionCodes };
};

const checkPermission = (code) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(403).json(forbidden('用户未登录'));
    }

    const { permissionCodes } = await getUserPermissions(req.user.id);

    if (permissionCodes.includes(code) || permissionCodes.includes('*')) {
      next();
    } else {
      return res.status(403).json(forbidden(`缺少权限：${code}`));
    }
  });
};

const loadUserPermissions = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.id) {
    const { roles, permissions, permissionCodes } = await getUserPermissions(req.user.id);
    req.user.roles = roles;
    req.user.permissions = permissions;
    req.user.permissionCodes = permissionCodes;
  }
  next();
});

module.exports = {
  checkPermission,
  loadUserPermissions,
  getUserPermissions
};
