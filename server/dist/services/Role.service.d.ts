import { RoleAttributes, RoleCreationAttributes } from '../models/Role.model';
import { PaginationParams, PaginationResult } from '../types';
interface CreateRoleRequest extends RoleCreationAttributes {
    permissionIds?: string[];
}
interface UpdateRoleRequest extends Partial<RoleAttributes> {
    permissionIds?: string[];
}
interface BatchCopyRequest {
    sourceRoleIds: string[];
    newNamePrefix: string;
    scenario?: string;
    permissionDelta?: {
        add?: string[];
        remove?: string[];
    };
}
interface BatchOperateResult {
    success: string[];
    failed: Array<{
        id: string;
        reason: string;
    }>;
}
interface PermissionChangeSummary {
    removedCount: number;
    addedCount: number;
    lockedCount: number;
}
interface RoleQueryParams extends PaginationParams {
    keyword?: string;
    status?: number;
}
declare class RoleService {
    createRole(currentUser: any, data: CreateRoleRequest): Promise<import("../models/Role.model").Role>;
    updateRoleWithPermissions(currentUser: any, roleId: string, data: UpdateRoleRequest): Promise<{
        role: any;
        summary: PermissionChangeSummary;
        downshifted: boolean;
    }>;
    batchCopyRoles(currentUser: any, params: BatchCopyRequest): Promise<BatchOperateResult>;
    batchUpdateStatus(currentUser: any, ids: string[], status: number): Promise<BatchOperateResult>;
    checkRoleDependencies(roleId: string): Promise<{
        hasDependencies: boolean;
        dependencies: {
            type: string;
            count: number;
            description: string;
        }[];
        canDelete: boolean;
    }>;
    deleteRole(currentUser: any, roleId: string): Promise<void>;
    searchDeletionLogs(params: {
        keyword?: string;
        startTime?: string;
        endTime?: string;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    findAll(params: RoleQueryParams): Promise<PaginationResult<any>>;
    getPermissions(roleId: string): Promise<any>;
    getBoundUserCount(roleId: string): Promise<number>;
    private generateRoleCode;
}
declare const _default: RoleService;
export default _default;
//# sourceMappingURL=Role.service.d.ts.map