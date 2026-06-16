import { BaseRepository } from './BaseRepository';
import { Role } from '../models';
import { FindOptions, Includeable, WhereOptions, Op } from 'sequelize';
import { Permission } from '../models';
import { RolePermission } from '../models';
import { UserRole } from '../models';
import { User } from '../models';

export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super(Role);
  }

  async findByCode(code: string): Promise<Role | null> {
    return await this.model.findOne({ where: { code } });
  }

  async findWithPermissions(roleId: string): Promise<Role | null> {
    return await this.model.findByPk(roleId, {
      include: [
        {
          model: Permission,
          through: { attributes: [] },
          where: { status: 1 },
          required: false
        }
      ]
    });
  }

  async findAllWithPermissions(options?: FindOptions): Promise<Role[]> {
    return await this.model.findAll({
      include: [
        {
          model: Permission,
          through: { attributes: [] },
          where: { status: 1 },
          required: false
        }
      ],
      ...options
    });
  }

  async findByUserId(userId: string): Promise<Role[]> {
    return await this.model.findAll({
      include: [
        {
          model: User,
          through: { attributes: [], where: { user_id: userId } },
          required: true
        }
      ],
      where: { status: 1 }
    });
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await RolePermission.destroy({ where: { role_id: roleId } });
    if (permissionIds && permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId
      }));
      await RolePermission.bulkCreate(rolePermissions as any);
    }
  }

  async hasUsers(roleId: string): Promise<boolean> {
    const count = await UserRole.count({ where: { role_id: roleId } });
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

    return where;
  }

  getPermissionsInclude(): Includeable {
    return {
      model: Permission,
      through: { attributes: [] },
      where: { status: 1 },
      required: false,
      attributes: ['id', 'name', 'code']
    };
  }
}