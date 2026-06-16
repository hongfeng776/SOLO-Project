const { User, Role } = require('../models');
const { Op } = require('../config/database');
const { hashPassword } = require('../utils/auth');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

class UserService {
  async getUserList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['username', 'real_name', 'email', 'phone']);

    const where = { ...search };

    if (query.roleId) where.role_id = query.roleId;
    if (query.status !== undefined) where.status = query.status;

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_code', 'role_name'] }],
      offset,
      limit: pageSize,
      order,
      attributes: { exclude: ['password'] },
    });

    return {
      list: rows.map((user) => ({
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        department: user.department,
        status: user.status,
        lastLoginAt: user.last_login_at,
        lastLoginIp: user.last_login_ip,
        loginCount: user.login_count,
        remark: user.remark,
        role: user.role ? {
          id: user.role.id,
          code: user.role.role_code,
          name: user.role.role_name,
        } : null,
        createdAt: user.created_at,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getUserById(id) {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_code', 'role_name'] }],
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
      roleId: user.role_id,
      status: user.status,
      remark: user.remark,
      role: user.role ? {
        id: user.role.id,
        code: user.role.role_code,
        name: user.role.role_name,
      } : null,
    };
  }

  async createUser(data, operatorId) {
    const exist = await User.findOne({ where: { username: data.username } });
    if (exist) {
      throw new ConflictError('用户名已存在');
    }

    if (data.email) {
      const existEmail = await User.findOne({ where: { email: data.email } });
      if (existEmail) {
        throw new ConflictError('邮箱已被使用');
      }
    }

    const user = await User.create({
      username: data.username,
      password: await hashPassword(data.password || '123456'),
      real_name: data.realName,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      role_id: data.roleId,
      department: data.department,
      status: data.status ?? 1,
      remark: data.remark,
      created_by: operatorId,
    });

    return user.id;
  }

  async updateUser(id, data, operatorId) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    if (data.username && data.username !== user.username) {
      const exist = await User.findOne({ where: { username: data.username, id: { [Op.ne]: id } } });
      if (exist) {
        throw new ConflictError('用户名已存在');
      }
    }

    if (data.email && data.email !== user.email) {
      const existEmail = await User.findOne({ where: { email: data.email, id: { [Op.ne]: id } } });
      if (existEmail) {
        throw new ConflictError('邮箱已被使用');
      }
    }

    const updateData = {
      real_name: data.realName,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      role_id: data.roleId,
      department: data.department,
      status: data.status,
      remark: data.remark,
      updated_by: operatorId,
    };

    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    await User.update(updateData, { where: { id } });
    return true;
  }

  async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    await user.destroy();
    return true;
  }

  async batchDeleteUsers(ids) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要删除的用户');
    }
    await User.destroy({ where: { id: { [Op.in]: ids } } });
    return true;
  }

  async updateUserStatus(id, status) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    await User.update({ status }, { where: { id } });
    return true;
  }
}

module.exports = new UserService();
