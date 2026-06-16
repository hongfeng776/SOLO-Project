import { Op } from 'sequelize';
import permissionDAO from '@dao/PermissionDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';

interface PermissionNode {
  id: number;
  perm_name: string;
  perm_code: string;
  perm_type: string | null;
  parent_id: number | null;
  path: string | null;
  icon: string | null;
  sort_order: number;
  status: number;
  children: PermissionNode[];
}

class PermissionService {
  async getPermissionTree() {
    const list = await db.Permission.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']],
    });

    const nodes: PermissionNode[] = list.map((p: any) => ({
      id: p.id,
      perm_name: p.perm_name,
      perm_code: p.perm_code,
      perm_type: p.perm_type,
      parent_id: p.parent_id,
      path: p.path,
      icon: p.icon,
      sort_order: p.sort_order,
      status: p.status,
      children: [],
    }));

    const map = new Map<number, PermissionNode>();
    const roots: PermissionNode[] = [];

    nodes.forEach((node) => map.set(node.id, node));

    nodes.forEach((node) => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async getPermissionById(id: number) {
    const permission = await db.Permission.findByPk(id);
    if (!permission) {
      throw new AppError(404, 'Permission not found');
    }
    return permission;
  }

  async getPermissionList(params: { page: number; pageSize: number; keyword?: string; status?: number }) {
    const { page, pageSize, keyword, status } = params;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { perm_name: { [Op.like]: `%${keyword}%` } },
        { perm_code: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const { rows, count } = await db.Permission.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['sort_order', 'ASC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async createPermission(data: any) {
    const existing = await permissionDAO.findByPermCode(data.perm_code);
    if (existing) {
      throw new AppError(409, 'Permission code already exists');
    }
    return db.Permission.create(data);
  }

  async updatePermission(id: number, data: any) {
    const permission = await db.Permission.findByPk(id);
    if (!permission) {
      throw new AppError(404, 'Permission not found');
    }
    await db.Permission.update(data, { where: { id } });
    return db.Permission.findByPk(id);
  }

  async deletePermission(id: number) {
    const permission = await db.Permission.findByPk(id);
    if (!permission) {
      throw new AppError(404, 'Permission not found');
    }

    const children = await db.Permission.count({ where: { parent_id: id } });
    if (children > 0) {
      throw new AppError(400, 'Cannot delete permission with child nodes');
    }

    await db.Permission.destroy({ where: { id } });
  }
}

export default new PermissionService();
