const { User, Role } = require('../models');
const { generateTokens, hashPassword, comparePassword, saveTokenToRedis, removeTokenFromRedis, getStoredToken, verifyToken } = require('../utils/auth');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../utils/errors');

class AuthService {
  async login({ username, password, ip }) {
    const user = await User.findOne({
      where: { username },
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_code', 'role_name', 'permissions'] }],
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    if (user.status !== 1) {
      throw new BadRequestError('账号已被禁用或锁定');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError('密码错误');
    }

    const role = user.role;
    if (!role) {
      throw new BadRequestError('用户角色不存在');
    }

    const payload = {
      userId: user.id,
      username: user.username,
      roleId: role.id,
      roleCode: role.role_code,
      permissions: role.permissions || [],
    };

    const { accessToken, refreshToken } = generateTokens(payload);
    await saveTokenToRedis(user.id, accessToken, refreshToken);

    await User.update({
      last_login_at: new Date(),
      last_login_ip: ip,
      login_count: user.login_count + 1,
    }, {
      where: { id: user.id }
    });

    return {
      accessToken,
      refreshToken,
      userInfo: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: {
          id: role.id,
          code: role.role_code,
          name: role.role_name,
        },
      },
    };
  }

  async logout(userId) {
    await removeTokenFromRedis(userId);
    return true;
  }

  async refreshToken(refreshToken) {
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      throw new UnauthorizedError('刷新令牌无效');
    }

    const storedToken = await getStoredToken(decoded.userId, 'refresh');
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError('刷新令牌已失效');
    }

    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_code', 'role_name', 'permissions'] },
    });

    if (!user || user.status !== 1) {
      throw new UnauthorizedError('用户不存在或已禁用');
    }

    const role = user.role;
    const payload = {
      userId: user.id,
      username: user.username,
      roleId: role.id,
      roleCode: role.role_code,
      permissions: role.permissions || [],
    };

    const tokens = generateTokens(payload);
    await saveTokenToRedis(user.id, tokens.accessToken, tokens.refreshToken);

    return tokens;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const isValid = await comparePassword(oldPassword, user.password);
    if (!isValid) {
      throw new BadRequestError('原密码错误');
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    await this.logout(userId);

    return true;
  }

  async getCurrentUser(userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_code', 'role_name', 'permissions', 'description'] }],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      department: user.department,
      role: user.role ? {
        id: user.role.id,
        code: user.role.role_code,
        name: user.role.role_name,
        description: user.role.description,
      } : null,
      permissions: user.role ? user.role.permissions : [],
    };
  }
}

module.exports = new AuthService();
