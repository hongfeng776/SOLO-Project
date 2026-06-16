const { Role, User } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

class RoleService {
  async getRoleList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['role_code', 'role_name', 'description']);

    const where = { ...search };

    const { count, rows } = await Role.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: order.concat([['sort_order', 'ASC']]),
    });

    return {
      list: rows.map((role) => ({
        id: role.id,
        code: role.role_code,
        name: role.role_name,
        description: role.description,
        permissions: role.permissions,
        sortOrder: role.sort_order,
        status: role.status,
        createdAt: role.created_at,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getAllRoles() {
    const roles = await Role.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']],
    });
    return roles.map((role) => ({
      id: role.id,
      code: role.role_code,
      name: role.role_name,
    }));
  }

  async getRoleById(id) {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError('角色不存在');
    }
    return {
      id: role.id,
      code: role.role_code,
      name: role.role_name,
      description: role.description,
      permissions: role.permissions,
      sortOrder: role.sort_order,
      status: role.status,
    };
  }

  async createRole(data, operatorId) {
    const exist = await Role.findOne({ where: { role_code: data.code } });
    if (exist) {
      throw new ConflictError('角色编码已存在');
    }

    const role = await Role.create({
      role_code: data.code,
      role_name: data.name,
      description: data.description,
      permissions: data.permissions || [],
      sort_order: data.sortOrder ?? 0,
      status: data.status ?? 1,
      created_by: operatorId,
    });

    return role.id;
  }

  async updateRole(id, data, operatorId) {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError('角色不存在');
    }

    if (data.code && data.code !== role.role_code) {
      const exist = await Role.findOne({ where: { role_code: data.code, id: { [Op.ne]: id } } });
      if (exist) {
        throw new ConflictError('角色编码已存在');
      }
    }

    await Role.update({
      role_code: data.code,
      role_name: data.name,
      description: data.description,
      permissions: data.permissions,
      sort_order: data.sortOrder,
      status: data.status,
      updated_by: operatorId,
    }, { where: { id } });

    return true;
  }

  async deleteRole(id) {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError('角色不存在');
    }

    const userCount = await User.count({ where: { role_id: id } });
    if (userCount > 0) {
      throw new BadRequestError('该角色下存在用户，无法删除');
    }

    await role.destroy();
    return true;
  }
}

module.exports = new RoleService();
