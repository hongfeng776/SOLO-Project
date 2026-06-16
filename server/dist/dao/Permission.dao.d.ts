import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Permission, { PermissionAttributes, PermissionCreationAttributes } from '../models/Permission.model';
export interface PermissionTree extends PermissionAttributes {
    children?: PermissionTree[];
}
declare class PermissionDao {
    create(data: PermissionCreationAttributes, options?: CreateOptions): Promise<Permission>;
    findByPk(id: string, options?: FindOptions): Promise<Permission | null>;
    findOne(options: FindOptions): Promise<Permission | null>;
    findAll(options?: FindOptions): Promise<Permission[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: Permission[];
        count: number;
    }>;
    update(data: Partial<PermissionAttributes>, options: UpdateOptions): Promise<[number, Permission[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: CountOptions): Promise<number>;
    findById(id: string): Promise<Permission | null>;
    softDelete(id: string): Promise<number>;
    bulkSoftDelete(ids: string[]): Promise<number>;
    existsByCode(code: string): Promise<boolean>;
    existsByCodeAndId(code: string, excludeId: string): Promise<boolean>;
    findTree(): Promise<PermissionTree[]>;
    private buildTree;
}
declare const _default: PermissionDao;
export default _default;
//# sourceMappingURL=Permission.dao.d.ts.map