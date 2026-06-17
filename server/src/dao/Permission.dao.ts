import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op, fn, col } from 'sequelize';
import Permission, { PermissionAttributes, PermissionCreationAttributes } from '../models/Permission.model';
import RolePermission from '../models/RolePermission.model';
import { OperationLog } from '../models/OperationLog.model';
import { PermissionType } from '../constants/enum';

export interface PermissionTree extends PermissionAttributes {
  children?: PermissionTree[];
}

interface PermissionQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  type?: string;
  module?: string;
  status?: number;
  level?: number;
}

class PermissionDao {
  public async create(data: PermissionCreationAttributes, options?: CreateOptions): Promise<Permission> {
    return Permission.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<Permission | null> {
    return Permission.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<Permission | null> {
    return Permission.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<Permission[]> {
    return Permission.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: Permission[]; count: number }> {
    return Permission.findAndCountAll(options);
  }

  public async update(data: Partial<PermissionAttributes>, options: UpdateOptions): Promise<[number, Permission[]]> {
    return Permission.update(data, options) as unknown as Promise<[number, Permission[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return Permission.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return Permission.count(options);
  }

  public async findById(id: string): Promise<Permission | null> {
    return this.findByPk(id);
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

  public async existsByPath(path: string, excludeId?: string): Promise<boolean> {
    const where: any = {
      path,
      type: { [Op.in]: [PermissionType.MENU, 'directory'] },
    };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  }

  public async findByIds(ids: string[]): Promise<Permission[]> {
    if (!ids || ids.length === 0) return [];
    return this.findAll({ where: { id: { [Op.in]: ids } } });
  }

  public async getChildren(parentId: string): Promise<Permission[]> {
    return this.findAll({ where: { parentId }, order: [['sort', 'ASC'], ['createdAt', 'ASC']] });
  }

  public async hasChildren(parentId: string): Promise<boolean> {
    const count = await this.count({ where: { parentId } });
    return count > 0;
  }

  public async findByModule(module: string): Promise<Permission[]> {
    return this.findAll({ where: { module }, order: [['sort', 'ASC'], ['createdAt', 'ASC']] });
  }

  public async getMaxLevel(): Promise<number> {
    const result = await Permission.findOne({
      attributes: [[fn('MAX', col('level')), 'maxLevel']],
      raw: true,
    }) as any;
    return result?.maxLevel || 0;
  }

  public async countByStatus(): Promise<{ enabled: number; disabled: number }> {
    const enabled = await this.count({ where: { status: 1 } });
    const disabled = await this.count({ where: { status: 0 } });
    return { enabled, disabled };
  }

  public async getBoundRoleCount(permissionId: string): Promise<number> {
    return RolePermission.count({ where: { permissionId } });
  }

  public async getAccessLogCount(permissionId: string, days: number = 30): Promise<number> {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);
    return OperationLog.count({
      where: {
        targetId: permissionId,
        createdAt: { [Op.gte]: startTime },
      },
    });
  }

  public async findAllPaged(params: PermissionQueryParams): Promise<{ rows: Permission[]; count: number }> {
    const { page, pageSize, keyword, type, module, status, level } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { path: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (type) where.type = type;
    if (module) where.module = module;
    if (status !== undefined) where.status = status;
    if (level !== undefined) where.level = level;
    return Permission.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['sort', 'ASC'], ['createdAt', 'ASC']],
    });
  }

  public async findTree(): Promise<PermissionTree[]> {
    const allPermissions = await this.findAll({
      order: [['sort', 'ASC'], ['createdAt', 'ASC']],
    });
    return this.buildTree(allPermissions.map((p) => p.toJSON() as PermissionAttributes));
  }

  private buildTree(permissions: PermissionAttributes[]): PermissionTree[] {
    const map = new Map<string, PermissionTree>();
    const roots: PermissionTree[] = [];

    permissions.forEach((perm) => {
      map.set(perm.id, { ...perm, children: [] });
    });

    permissions.forEach((perm) => {
      const node = map.get(perm.id)!;
      if (perm.parentId && map.has(perm.parentId)) {
        const parent = map.get(perm.parentId)!;
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}

export default new PermissionDao();
