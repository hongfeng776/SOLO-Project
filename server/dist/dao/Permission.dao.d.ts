import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Permission, { PermissionAttributes, PermissionCreationAttributes } from '../models/Permission.model';
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
    existsByPath(path: string, excludeId?: string): Promise<boolean>;
    findByIds(ids: string[]): Promise<Permission[]>;
    getChildren(parentId: string): Promise<Permission[]>;
    hasChildren(parentId: string): Promise<boolean>;
    findByModule(module: string): Promise<Permission[]>;
    getMaxLevel(): Promise<number>;
    countByStatus(): Promise<{
        enabled: number;
        disabled: number;
    }>;
    getBoundRoleCount(permissionId: string): Promise<number>;
    getAccessLogCount(permissionId: string, days?: number): Promise<number>;
    findAllPaged(params: PermissionQueryParams): Promise<{
        rows: Permission[];
        count: number;
    }>;
    findTree(): Promise<PermissionTree[]>;
    private buildTree;
}
declare const _default: PermissionDao;
export default _default;
//# sourceMappingURL=Permission.dao.d.ts.map