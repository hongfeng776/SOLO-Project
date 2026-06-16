const BaseService = require('./BaseService');
const User = require('../models/User');
const Role = require('../models/Role');
const { sign } = require('../utils/jwt');
const { compare } = require('../utils/password');
const { UnauthorizedError, NotFoundError } = require('../utils/error');

class AuthService extends BaseService {
  constructor() {
    super(User);
  }

  async login(username, password) {
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    if (user.status !== 1) {
      throw new UnauthorizedError('账号已被禁用');
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    const role = await Role.findByPk(user.roleId);
    
    const token = sign({
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
      roleCode: role ? role.code : null
    });

    return { token };
  }

  async getUserInfo(userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'code', 'permissions'] }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return user;
  }

  async logout() {
    return true;
  }
}

module.exports = new AuthService();
