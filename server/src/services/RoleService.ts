import { Op } from 'sequelize';
import roleDAO from '@dao/RoleDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';

class RoleService {
  async getRoleList(params: { page: number; pageSize: number; keyword?: string; status?: number }) {
    const { page, pageSize, keyword, status } = params;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { role_name: { [Op.like]: `%${keyword}%` } },
        { role_code: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const { rows, count } = await db.Role.findAndCountAll({
      where,
      include: [{ model: db.Permission, as: 'permissions', attributes: ['id'] }],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    const list = rows.map((role: any) => {
      const json = role.toJSON();
      return { ...json, permissionCount: json.permissions?.length || 0 };
    });

    return { list, total: count, page, pageSize };
  }

  async getRoleById(id: number) {
    const role = await db.Role.findByPk(id, {
      include: [{ model: db.Permission, as: 'permissions' }],
    });
    if (!role) {
      throw new AppError(404, 'Role not found');
    }
    return role;
  }

  async createRole(data: any) {
    const existing = await roleDAO.findByRoleCode(data.role_code);
    if (existing) {
      throw new AppError(409, 'Role code already exists');
    }
    return db.Role.create(data);
  }

  async updateRole(id: number, data: any) {
    const role = await db.Role.findByPk(id);
    if (!role) {
      throw new AppError(404, 'Role not found');
    }
    await db.Role.update(data, { where: { id } });
    return db.Role.findByPk(id);
  }

  async deleteRole(id: number) {
    const role = await db.Role.findByPk(id);
    if (!role) {
      throw new AppError(404, 'Role not found');
    }
    await db.Role.destroy({ where: { id } });
  }

  async assignPermissions(roleId: number, permIds: number[]) {
    const role = await db.Role.findByPk(roleId);
    if (!role) {
      throw new AppError(404, 'Role not found');
    }

    await db.RolePermission.destroy({ where: { role_id: roleId } });

    if (permIds.length > 0) {
      const records = permIds.map((permId) => ({ role_id: roleId, perm_id: permId }));
      await db.RolePermission.bulkCreate(records);
    }

    return db.Role.findByPk(roleId, {
      include: [{ model: db.Permission, as: 'permissions' }],
    });
  }
}

export default new RoleService();
