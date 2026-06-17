import { CreateUserRequest, UpdateUserRequest, PaginationParams, PaginationResult } from '../types';
import { UserRole } from '../constants/enum';
interface CreateAdminRequest {
    username: string;
    password: string;
    nickname: string;
    email: string;
    phone: string;
    role: UserRole;
    roleId: string;
    permissionIds?: string[];
    position?: string;
    positionLevel?: number;
}
interface UpdateAdminRequest {
    nickname?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    roleId?: string;
    permissionIds?: string[];
    status?: number;
    position?: string;
    positionLevel?: number;
}
interface UserQueryParams {
    page: number;
    pageSize: number;
    role?: string;
    status?: number;
    positionLevel?: number;
    permissionId?: string;
    keyword?: string;
    startTime?: string;
    endTime?: string;
}
interface BatchOperateResult {
    success: string[];
    failed: Array<{
        id: string;
        reason: string;
    }>;
}
declare class UserService {
    create(data: CreateUserRequest): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    findById(id: string): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    findByUsername(username: string): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    findAll(params: PaginationParams): Promise<PaginationResult<any>>;
    update(id: string, data: UpdateUserRequest): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    delete(id: string): Promise<void>;
    createAdmin(currentUser: any, data: CreateAdminRequest): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    updateAdmin(currentUser: any, id: string, data: UpdateAdminRequest): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    findAllAdvanced(params: UserQueryParams): Promise<any>;
    batchUpdateStatus(currentUser: any, ids: string[], status: number): Promise<BatchOperateResult>;
    batchResetPermissions(currentUser: any, ids: string[]): Promise<BatchOperateResult>;
    checkDeleteDependencies(id: string): Promise<{
        hasDependencies: boolean;
        dependencies: {
            type: string;
            count: number;
            description: string;
        }[];
        canDelete: boolean;
    }>;
    deleteAdmin(currentUser: any, id: string): Promise<void>;
    getUserTraceInfo(id: string): Promise<{
        id: string;
        username: string;
        createdBy: string | undefined;
        createdByName: string | undefined;
        createdAt: Date;
        activatedAt: Date | undefined;
        lastLoginAt: Date | undefined;
        lastActiveAt: Date | undefined;
    }>;
    getPermissionMutualExclusionRules(): import("../constants/enum").PermissionMutualExclusion[];
    private sanitizeUser;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=User.service.d.ts.map