import { PermissionTree } from '../dao/Permission.dao';
import { PermissionAttributes, PermissionCreationAttributes } from '../models/Permission.model';
declare class PermissionService {
    create(data: PermissionCreationAttributes): Promise<import("../models/Permission.model").Permission>;
    findById(id: string): Promise<import("../models/Permission.model").Permission>;
    findTree(): Promise<PermissionTree[]>;
    update(id: string, data: Partial<PermissionAttributes>): Promise<import("../models/Permission.model").Permission | null>;
    delete(id: string): Promise<void>;
    bulkDelete(ids: string[]): Promise<void>;
    updateStatus(id: string, status: number): Promise<void>;
}
declare const _default: PermissionService;
export default _default;
//# sourceMappingURL=Permission.service.d.ts.map