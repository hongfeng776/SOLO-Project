import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import Role, { RoleAttributes, RoleCreationAttributes } from '../models/Role.model';
import RolePermission from '../models/RolePermission.model';
import Permission from '../models/Permission.model';

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
}

export default new RoleDao();
