import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op, literal } from 'sequelize';
import Role, { RoleAttributes, RoleCreationAttributes } from '../models/Role.model';
import RolePermission from '../models/RolePermission.model';
import Permission from '../models/Permission.model';
import UserRole from '../models/UserRole.model';

interface RoleQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
}

class RoleDao {
  public async create(data: RoleCreationAttributes, options?: CreateOptions): Promise<Role> {
    return Role.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<Role | null> {
    return Role.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<Role | null> {
    return Role.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<Role[]> {
    return Role.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: Role[]; count: number }> {
    return Role.findAndCountAll(options);
  }

  public async update(data: Partial<RoleAttributes>, options: UpdateOptions): Promise<[number, Role[]]> {
    return Role.update(data, options) as unknown as Promise<[number, Role[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return Role.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return Role.count(options);
  }

  public async findById(id: string): Promise<Role | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: RoleQueryParams): Promise<{ rows: Role[]; count: number }> {
    const { page, pageSize, keyword, status } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status !== undefined) {
      where.status = status;
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['sort', 'ASC'], ['createdAt', 'DESC']],
    });
  }

  public async softDelete(id: string): Promise<number> {
    return this.destroy({ where: { id } });
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    return this.destroy({ where: { id: { [Op.in]: ids } } });
  }

  public async existsByCode(code: string): Promise<boolean> {
    const count = await this.count({ where: { code } });
    return count > 0;
  }

  public async existsByCodeAndId(code: string, excludeId: string): Promise<boolean> {
    const count = await this.count({ where: { code, id: { [Op.ne]: excludeId } } });
    return count > 0;
  }

  public async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await RolePermission.destroy({ where: { roleId } });
    if (permissionIds.length > 0) {
      const records = permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      }));
      await RolePermission.bulkCreate(records);
    }
  }

  public async getPermissions(roleId: string): Promise<Permission[]> {
    const rolePermissions = await RolePermission.findAll({
      where: { roleId },
      attributes: ['permissionId'],
    });
    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    if (permissionIds.length === 0) {
      return [];
    }
    return Permission.findAll({
      where: { id: { [Op.in]: permissionIds } },
      order: [['sort', 'ASC']],
    });
  }

  public async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const where: any = { name };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  }

  public async countByLevel(): Promise<Array<{ level: number; count: number }>> {
    const results = await Role.findAll({
      attributes: [
        'level',
        [literal('COUNT(*)'), 'count'],
      ],
      group: ['level'],
      raw: true,
    }) as unknown as Array<{ level: number; count: string }>;

    return results.map((r) => ({
      level: Number(r.level),
      count: Number(r.count),
    }));
  }

  public async getBoundUserIds(roleId: string): Promise<string[]> {
    const userRoles = await UserRole.findAll({
      where: { roleId },
      attributes: ['userId'],
    });
    return userRoles.map((ur) => ur.userId);
  }

  public async getBoundUserCount(roleId: string): Promise<number> {
    return UserRole.count({ where: { roleId } });
  }

  public async findAllPagedWithUserCount(
    params: RoleQueryParams
  ): Promise<{ rows: any[]; count: number }> {
    const { page, pageSize, keyword, status } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status !== undefined) {
      where.status = status;
    }

    const { rows, count } = await Role.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['sort', 'ASC'], ['createdAt', 'DESC']],
      attributes: {
        include: [
          [
            literal(
              '(SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = role.id)'
            ),
            'userCount',
          ],
        ],
      },
    });

    const enrichedRows = rows.map((role) => {
      const json = role.toJSON() as any;
      json.userCount = Number(json.userCount) || 0;
      return json;
    });

    return { rows: enrichedRows, count };
  }

  public async copyRolePermissions(sourceRoleId: string, targetRoleId: string): Promise<void> {
    const permissions = await this.getPermissions(sourceRoleId);
    const permissionIds = permissions.map((p) => p.id);
    await this.assignPermissions(targetRoleId, permissionIds);
  }

  public async countByLevelLessThan(level: number): Promise<number> {
    return Role.count({
      where: {
        level: { [Op.lt]: level },
      },
    });
  }
}

export default new RoleDao();
