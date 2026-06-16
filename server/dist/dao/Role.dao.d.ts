import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Role, { RoleAttributes, RoleCreationAttributes } from '../models/Role.model';
import Permission from '../models/Permission.model';
interface RoleQueryParams {
    page: number;
    pageSize: number;
    keyword?: string;
    status?: number;
}
declare class RoleDao {
    create(data: RoleCreationAttributes, options?: CreateOptions): Promise<Role>;
    findByPk(id: string, options?: FindOptions): Promise<Role | null>;
    findOne(options: FindOptions): Promise<Role | null>;
    findAll(options?: FindOptions): Promise<Role[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: Role[];
        count: number;
    }>;
    update(data: Partial<RoleAttributes>, options: UpdateOptions): Promise<[number, Role[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: CountOptions): Promise<number>;
    findById(id: string): Promise<Role | null>;
    findAllPaged(params: RoleQueryParams): Promise<{
        rows: Role[];
        count: number;
    }>;
    softDelete(id: string): Promise<number>;
    bulkSoftDelete(ids: string[]): Promise<number>;
    existsByCode(code: string): Promise<boolean>;
    existsByCodeAndId(code: string, excludeId: string): Promise<boolean>;
    assignPermissions(roleId: string, permissionIds: string[]): Promise<void>;
    getPermissions(roleId: string): Promise<Permission[]>;
}
declare const _default: RoleDao;
export default _default;
//# sourceMappingURL=Role.dao.d.ts.map