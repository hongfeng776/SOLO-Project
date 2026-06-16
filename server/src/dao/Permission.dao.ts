import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import Permission, { PermissionAttributes, PermissionCreationAttributes } from '../models/Permission.model';

export interface PermissionTree extends PermissionAttributes {
  children?: PermissionTree[];
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
