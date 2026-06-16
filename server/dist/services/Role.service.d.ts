import { RoleAttributes, RoleCreationAttributes } from '../models/Role.model';
import { PaginationParams, PaginationResult } from '../types';
interface RoleQueryParams extends PaginationParams {
    keyword?: string;
    status?: number;
}
declare class RoleService {
    create(data: RoleCreationAttributes): Promise<import("../models/Role.model").Role>;
    findById(id: string): Promise<import("../models/Role.model").Role>;
    findAll(params: RoleQueryParams): Promise<PaginationResult<any>>;
    update(id: string, data: Partial<RoleAttributes>): Promise<import("../models/Role.model").Role | null>;
    delete(id: string): Promise<void>;
    bulkDelete(ids: string[]): Promise<void>;
    updateStatus(id: string, status: number): Promise<void>;
    assignPermissions(roleId: string, permissionIds: string[]): Promise<void>;
    getPermissions(roleId: string): Promise<import("../models").Permission[]>;
}
declare const _default: RoleService;
export default _default;
//# sourceMappingURL=Role.service.d.ts.map