import { BaseRepository } from './BaseRepository';
import { Permission } from '../models';
import { FindOptions, WhereOptions, Op } from 'sequelize';
import { Role } from '../models';
import { RolePermission } from '../models';

export class PermissionRepository extends BaseRepository<Permission> {
  constructor() {
    super(Permission);
  }

  async findByCode(code: string): Promise<Permission | null> {
    return await this.model.findOne({ where: { code } });
  }

  async findTree(parentId?: string | null): Promise<Permission[]> {
    const where: any = { status: 1 };
    if (parentId !== undefined) {
      where.parent_id = parentId;
    }
    return await this.model.findAll({
      where,
      order: [['sort', 'ASC'], ['created_at', 'ASC']]
    });
  }

  async findByRoleIds(roleIds: string[]): Promise<Permission[]> {
    if (!roleIds || roleIds.length === 0) return [];

    return await this.model.findAll({
      include: [
        {
          model: Role,
          through: { attributes: [], where: { role_id: roleIds } },
          required: true
        }
      ],
      where: { status: 1 },
      order: [['sort', 'ASC'], ['created_at', 'ASC']],
      distinct: true
    });
  }

  async findByCodes(codes: string[]): Promise<Permission[]> {
    return await this.model.findAll({
      where: {
        code: { [Op.in]: codes },
        status: 1
      }
    });
  }

  async findAllTree(): Promise<Permission[]> {
    return await this.model.findAll({
      order: [['sort', 'ASC'], ['created_at', 'ASC']]
    });
  }

  async hasChildren(parentId: string): Promise<boolean> {
    const count = await this.model.count({ where: { parent_id: parentId } });
    return count > 0;
  }

  async hasRoles(permissionId: string): Promise<boolean> {
    const count = await RolePermission.count({ where: { permission_id: permissionId } });
    return count > 0;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.keyword}%` } },
        { code: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.type !== undefined) {
      where.type = params.type;
    }

    return where;
  }
}