import { PermissionTree } from '../dao/Permission.dao';
import Permission, { PermissionAttributes, PermissionCreationAttributes } from '../models/Permission.model';
interface PermissionQueryParams {
    page: number;
    pageSize: number;
    keyword?: string;
    type?: string;
    module?: string;
    status?: number;
    level?: number;
}
interface BatchSortRequest {
    items: Array<{
        id: string;
        sort: number;
        parentId?: string;
        level?: number;
    }>;
}
interface BatchOperateResult {
    success: string[];
    failed: Array<{
        id: string;
        reason: string;
    }>;
}
interface PermissionDependencies {
    hasDependencies: boolean;
    canDelete: boolean;
    dependencies: Array<{
        type: string;
        count: number;
        description: string;
    }>;
}
declare class PermissionService {
    createPermission(currentUser: any, data: PermissionCreationAttributes & {
        visibleRange?: string;
    }): Promise<Permission>;
    updatePermission(currentUser: any, id: string, data: Partial<PermissionAttributes>): Promise<Permission | null>;
    updateStatusBatch(currentUser: any, ids: string[], status: number): Promise<BatchOperateResult>;
    batchSort(currentUser: any, req: BatchSortRequest): Promise<BatchOperateResult>;
    checkDeleteDependencies(id: string): Promise<PermissionDependencies>;
    deletePermission(currentUser: any, id: string): Promise<void>;
    findIdlePermissions(params: PermissionQueryParams & {
        unusedDays?: number;
    }): Promise<any[]>;
    findTree(): Promise<PermissionTree[]>;
    findById(id: string): Promise<any>;
    findByModule(module: string): Promise<any>;
    private clearPermissionCache;
}
declare const _default: PermissionService;
export default _default;
//# sourceMappingURL=Permission.service.d.ts.map